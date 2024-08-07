import QRCode from 'qrcode';
//import { Bot, Redis, Segment, EventType } from 'yunzai';
import { MainProps } from "../../components/dynamic/MainPage";
import Config from '../../utils/config';
import Image from '../../utils/image';
import { ScreenshotOptions } from './../../utils/puppeteer.render';
import { BiliGetWebData } from './bilibili.get.web.data';
import { postGateway, readSyncCookie } from './bilibili.models';
import { BiliQuery } from './bilibili.query';

declare const Bot: any, redis: any, segment: any;

declare const logger: any;

export class BiliTask {
  taskName: string;
  key: string;
  e?: any;
  constructor(e?: any) {
    this.taskName = "biliTask";
    this.key = "Yz:yuki:bili:upPush:";
  }

  async hendleEventDynamicData(uid: string | number, count: number = 0): Promise<any> {
    const resp = await new BiliGetWebData().getBiliDynamicListDataByUid(uid);
    const resjson = await resp.data;
    let { cookie } = await readSyncCookie();
    if (resjson.code === 0) {
      return resjson;
    } else if (resjson.code === -352) {
      await postGateway(cookie);
      if (count < 3) {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (10500 - 2000 + 1) + 2000))); // 随机延时2-10.5秒
        await this.hendleEventDynamicData(uid, count + 1);
        logger.error(`获取 ${uid} 动态，Gateway count：${String(count)}`);
      } else {
        count = 0;
        return resjson;
      }
    } else if (resjson.code !== 0) {
      return resjson;
    }
  }

  async runTask() {
    let biliConfigData = await Config.getUserConfig("bilibili", "config");
    let biliPushData = await Config.getUserConfig("bilibili", "push");
    let interval: number = biliConfigData.interval || 7200;
    let lastLiveStatus = JSON.parse(await redis.get("yuki:bililive:lastlivestatus")) || {};
    const uidMap = new Map(); // 存放 uid 与推送信息的映射
    const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组

    await this.processBiliData(biliPushData, uidMap, dynamicList, lastLiveStatus);

    let now: number = Date.now() / 1000; // 时间戳（秒）
    await this.pushDynamicMessages(uidMap, dynamicList, now, interval, biliConfigData);
  }

  /**
   * 处理Bilibili数据，获取动态列表并构建 uid 映射
   * @param biliPushData Bilibili推送数据
   * @param uidMap uid 映射
   * @param dynamicList 动态列表
   * @param lastLiveStatus 最后直播状态
   */
  async processBiliData(biliPushData: any, uidMap: Map<any, any>, dynamicList: any, lastLiveStatus: any) {
    for (let chatType in biliPushData) { // 遍历 group 和 private
      for (let chatId in biliPushData[chatType]) {
        const subUpsOfChat: { uid: string; bot_id: string[]; name: string; type: string[] }[] = biliPushData[chatType][chatId] || [];
        for (let subInfoOfup of subUpsOfChat) {
          if (!lastLiveStatus[subInfoOfup.uid]) {
            lastLiveStatus[subInfoOfup.uid] = 0;
          }

          const resp: any = await this.hendleEventDynamicData(subInfoOfup.uid);

          if (resp) {
            if (resp.code === 0) {
              const dynamicData = resp.data?.items || [];
              dynamicList[subInfoOfup.uid] = dynamicData;
            } else if (resp.code === -352) {
              logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：-352`);
              continue;
            } else if (resp.code !== 0) {
              logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：${resp.code}`);
              return;
            }
          } else {
            logger.error(`获取 ${subInfoOfup.uid} 动态失败，resp 为空`);
            return;
          }

          const chatIds: any[] = Array.from(new Set([...Object((uidMap.get(subInfoOfup.uid) && uidMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
          const bot_id: string[] | number[] = subInfoOfup.bot_id || [];
          const { name, type } = subInfoOfup;
          uidMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type, chatType });
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (8000 - 2000 + 1) + 2000))); // 随机延时2-8秒
        }
      }
    }
  }

  /**
   * 推送动态消息
   * @param uidMap uid 映射
   * @param dynamicList 动态列表
   * @param now 当前时间戳
   * @param interval 推送间隔时间
   * @param biliConfigData Bilibili配置数据
   */
  async pushDynamicMessages(uidMap: Map<any, any>, dynamicList: any, now: number, interval: number, biliConfigData: any) {
    for (let [key, value] of uidMap) {
      const tempDynamicList = dynamicList[key] || [];
      const willPushDynamicList = [];

      for (let dynamicItem of tempDynamicList) {
        let author = dynamicItem?.modules?.module_author || {};
        logger.info(`正在检测B站动态 [ ${author?.name} : ${author?.mid} ]`);
        if (!author?.pub_ts) continue; // 如果动态没有发布时间，跳过当前循环
        if (Number(now - author.pub_ts) > interval) {
          logger.info(`超过间隔，跳过  [ ${author?.name} : ${author?.mid} ] ${author?.pub_time} 的动态`);
          continue;
        } // 如果超过推送时间间隔，跳过当前循环
        if (dynamicItem.type === "DYNAMIC_TYPE_FORWARD" && !biliConfigData.pushTransmit) continue; // 如果关闭了转发动态的推送，跳过当前循环
        willPushDynamicList.push(dynamicItem);
      }

      const pushMapInfo = value || {}; // 获取当前 uid 对应的推送信息

      const { chatIds, bot_id, upName, type, chatType } = pushMapInfo;

      // 遍历待推送的动态数组，发送动态消息
      for (let pushDynamicData of willPushDynamicList) {
        if (chatIds && chatIds.length) {
          for (let chatId of chatIds) {
            if (type && type.length && !type.includes(pushDynamicData.type)) continue; // 如果禁用了某类型的动态推送，跳过当前循环
            await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType); // 发送动态消息
            await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 2000))); // 随机延时2-6.5秒
          }
        }
      }
    }
  }

  /*发送动态*/
  async sendDynamic(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, biliConfigData: any, chatType: string) {
    const id_str = pushDynamicData.id_str;

    let sended: string | null = await redis.get(`${this.key}${chatId}:${id_str}`);
    if (sended) return; // 如果已经发送过，则直接返回

    if (!!biliConfigData.pushMsgMode) {
      const { data, uid } = await BiliQuery.formatDynamicData(pushDynamicData); // 处理动态数据
      const extentData = { ...data };

      const eval2 = eval;
      let banWords: RegExp = eval2(`/${biliConfigData.banWords.join("|")}/g`); // 构建屏蔽关键字正则表达式
      if (new RegExp(banWords).test(`${extentData?.title}${extentData?.content}`)) {
        return "return"; // 如果动态包含屏蔽关键字，则直接返回
      }

      let boxGrid: boolean = !!biliConfigData.boxGrid === false ? false : true; // 是否启用九宫格样式，默认为 true
      let isSplit: boolean = !!biliConfigData.isSplit === false ? false : true; // 是否启用分片截图，默认为 true
      let style: string = isSplit ? '' : '.unfold { height: 7500px; }'; // 不启用分片截图模式的样式

      const urlQrcodeData: string = await QRCode.toDataURL(extentData?.url);
      let renderData: MainProps = this.buildRenderData(extentData, urlQrcodeData, boxGrid);

      const ScreenshotOptionsData: ScreenshotOptions = {
        addStyle: style,
        header: { 'Referer': 'https://space.bilibili.com/' },
        isSplit: isSplit,
        modelName: 'bilibili',
        SOptions: {
          type: 'jpeg',
          quality: 98,
        },
        saveHtmlfile: false,
      };

      let imgs: Buffer[] | null = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
      if (!imgs) return;

      redis.set(`${this.key}${chatId}:${id_str}`, "1", { EX: 3600 * 10 }); // 设置已发送标记

      (logger ?? Bot.logger)?.mark("优纪插件：B站动态执行推送");

      for (let i = 0; i < imgs.length; i++) {
        const image: Buffer = imgs[i];
        await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 2000))); // 随机延时2-6.5秒
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // 休眠1秒

    } else {
      const dynamicMsg = await BiliQuery.formatTextDynamicData(upName, pushDynamicData, false, biliConfigData); // 构建图文动态消息

      redis.set(`${this.key}${chatId}:${id_str}`, "1", { EX: 3600 * 10 }); // 设置已发送标记

      if (dynamicMsg == "continue") {
        return "return"; // 如果动态消息构建失败，则直接返回
      }

      if (biliConfigData.banWords.length > 0) {
        const banWords = new RegExp(biliConfigData.banWords.join("|"), "g"); // 构建屏蔽关键字正则表达式
        if (banWords.test(dynamicMsg.join(""))) {
          return "return"; // 如果动态消息包含屏蔽关键字，则直接返回
        }
      }

      await this.sendMessage(chatId, bot_id, chatType, dynamicMsg);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * 构建渲染数据
   * @param extentData 扩展数据
   * @param urlQrcodeData URL 二维码数据
   * @param boxGrid 是否启用九宫格样式
   * @returns 渲染数据
   */
  buildRenderData(extentData: any, urlQrcodeData: string, boxGrid: boolean): MainProps {
    if (extentData.orig && (extentData.orig).length !== 0) {
      return {
        data: {
          appName: "bilibili",
          boxGrid: boxGrid,
          type: extentData?.type,
          face: extentData?.face,
          pendant: extentData?.pendant,
          name: extentData?.name,
          pubTs: extentData?.pubTs,
          title: extentData?.title,
          content: extentData?.content,
          urlImgData: urlQrcodeData,
          created: extentData?.created,
          pics: extentData?.pics,
          category: extentData?.category,
          orig: {
            data: {
              type: extentData?.orig?.data?.type,
              face: extentData?.orig?.data?.face,
              pendant: extentData?.orig?.data?.pendant,
              name: extentData?.orig?.data?.name,
              pubTs: extentData?.orig?.data?.pubTs,
              title: extentData?.orig?.data?.title,
              content: extentData?.orig?.data?.content,
              pics: extentData?.orig?.data?.pics,
              category: extentData?.orig?.data?.category,
            }
          }
        }
      };
    } else {
      return {
        data: {
          appName: "bilibili",
          boxGrid: boxGrid,
          type: extentData?.type,
          face: extentData?.face,
          pendant: extentData?.pendant,
          name: extentData?.name,
          pubTs: extentData?.pubTs,
          title: extentData?.title,
          content: extentData?.content,
          urlImgData: urlQrcodeData,
          created: extentData?.created,
          pics: extentData?.pics,
          category: extentData?.category,
        }
      };
    }
  }

  /**
   * 渲染动态卡片
   * @param uid 用户 ID
   * @param renderData 渲染数据
   * @param ScreenshotOptionsData 截图选项数据
   * @returns 图片数据
   */
  async renderDynamicCard(uid: string, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions): Promise<Buffer[] | null> {
    const dynamicMsg = await Image.renderPage(uid, "MainPage", renderData, ScreenshotOptionsData); // 渲染动态卡片
    if (dynamicMsg !== false) {
      return dynamicMsg.img; // 缓存图片数据
    } else {
      return null;
    }
  }

  /**
   * 发送消息
   * @param chatId 聊天 ID
   * @param bot_id 机器人 ID
   * @param chatType 聊天类型
   * @param message 消息内容
   */
  async sendMessage(chatId: string | number, bot_id: string | number, chatType: string, message: any) {
    if (chatType === "group") {
      await (Bot[bot_id] ?? Bot)?.pickGroup(String(chatId)).sendMsg(message)  // 发送群聊
        .catch((error: any) => {
          (logger ?? Bot.logger)?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
        });
    } else if (chatType === "private") {
      await (Bot[bot_id] ?? Bot)?.pickUser(String(chatId)).sendMsg(message)
        .catch((error: any) => {
          (logger ?? Bot.logger)?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
        }); // 发送私聊
    }
  }

  /**
   * 随机延时
   * @param min 最小延时时间
   * @param max 最大延时时间
   */
  async randomDelay(min: number, max: number) {
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
  }
}
