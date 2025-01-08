import QRCode from 'qrcode';
import { MainProps } from '@/components/dynamic/MainPage';
import Config from '@/utils/config';
import { renderPage } from '@/utils/image';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
import { BiliGetWebData } from '@/models/bilibili/bilibili.main.get.web.data';
import { postGateway, readSyncCookie } from '@/models/bilibili/bilibili.main.models';
import { BiliQuery } from '@/models/bilibili/bilibili.main.query';

declare const Bot: any, redis: any, segment: any;

declare const logger: any;

export class BiliTask {
  taskName: string;
  groupKey: string;
  privateKey: string;
  e?: any;
  constructor(e?: any) {
    this.taskName = 'biliTask';
    this.groupKey = 'Yz:yuki:bili:upPush:group:';
    this.privateKey = 'Yz:yuki:bili:upPush:private:';
  }

  async hendleEventDynamicData(uid: string | number, count: number = 0): Promise<any> {
    let { cookie } = await readSyncCookie();
    const resp = await new BiliGetWebData().getBiliDynamicListDataByUid(uid);
    const resjson = await resp.data;

    if (!resjson || resjson.code !== 0 || resjson.code === -352) {
      await postGateway(cookie);
      if (count < 2) {
        await this.randomDelay(2000, 8000); // 随机延时2-8秒
        await this.hendleEventDynamicData(uid, count + 1);
        logger.error(`获取 ${uid} 动态，Gateway count：${String(count)}`);
      } else {
        count = 0;
      }
    }
    return resjson;
  }

  async runTask() {
    let biliConfigData = await Config.getUserConfig('bilibili', 'config');
    let biliPushData = await Config.getUserConfig('bilibili', 'push');
    let interval: number = biliConfigData?.interval || 7200;
    logger.debug(`当前B站功能配置：${JSON.stringify(biliConfigData)}`);
    const uidMap: Map<any, Map<string, any>> = new Map(); // 存放group 和 private 对应所属 uid 与推送信息的映射
    const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组

    await this.processBiliData(biliPushData, biliConfigData, uidMap, dynamicList);

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
  async processBiliData(
    biliPushData: {
      group?: {
        [chatId: string]: {
          bot_id: string;
          uid: string;
          name: string;
          type: string[];
        }[];
      };
      private?: {
        [chatId: string]: {
          bot_id: string;
          uid: string;
          name: string;
          type: string[];
        }[];
      };
    },
    biliConfigData: any,
    uidMap: Map<any, Map<string, any>>,
    dynamicList: any
  ) {
    let getDataRandomDelay: number = biliConfigData?.getDataRandomDelay || 8000; // 获取相邻up动态数据的随机延时间隔
    const requestedDataOfUids = new Map<string, any>(); // 存放已请求的 uid 映射
    for (let chatType in biliPushData) {
      // 遍历 group 和 private

      if (!uidMap.has(chatType)) {
        uidMap.set(chatType, new Map());
      }
      const chatTypeMap = uidMap.get(chatType); // 建立当前 chatType (group 或 private) 的 uid 映射
      if (chatTypeMap === undefined) continue; // 如果 chatTypeMap 未定义，跳过此次循环

      for (let chatId in biliPushData[chatType]) {
        const subUpsOfChat: { uid: string; bot_id: string[]; name: string; type: string[] }[] = Array.prototype.slice.call(
          biliPushData[chatType][chatId] || []
        );
        for (let subInfoOfup of subUpsOfChat) {
          let resp: any;
          // 检查是否已经请求过该 uid
          if (requestedDataOfUids.has(subInfoOfup.uid)) {
            resp = requestedDataOfUids.get(subInfoOfup.uid); // 从已请求的映射中获取响应数据
            const dynamicData = resp.data?.items || [];
            dynamicList[subInfoOfup.uid] = dynamicData;
          } else {
            resp = await this.hendleEventDynamicData(subInfoOfup.uid);
            if (resp) {
              if (resp.code === 0) {
                requestedDataOfUids.set(subInfoOfup.uid, resp); // 将响应数据存储到映射中
                const dynamicData = resp.data?.items || [];
                dynamicList[subInfoOfup.uid] = dynamicData;
              } else if (resp.code === -352) {
                logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：-352，请待下次任务自动重试`);
                return;
              } else if (resp.code !== 0) {
                logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：${resp.code}，请待下次任务自动重试`);
                return;
              }
            } else {
              logger.error(`获取 ${subInfoOfup.uid} 动态失败，无响应数据，请待下次任务自动重试`);
              return;
            }
          }

          const chatIds: any[] = Array.from(new Set([...Object((chatTypeMap.get(subInfoOfup.uid) && chatTypeMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
          const bot_id: string[] | number[] = subInfoOfup.bot_id || [];
          const { name, type } = subInfoOfup;
          chatTypeMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type });
          await this.randomDelay(2000, getDataRandomDelay); // 随机延时
        }
      }
    }
    requestedDataOfUids.clear(); // 清空已请求的 uid 映射
  }

  /**
   * 推送动态消息
   * @param uidMap uid 映射
   * @param dynamicList 动态列表
   * @param now 当前时间戳
   * @param interval 推送间隔时间
   * @param biliConfigData Bilibili配置数据
   */
  async pushDynamicMessages(uidMap: Map<any, Map<string, any>>, dynamicList: any, now: number, interval: number, biliConfigData: any) {
    for (let [chatType, chatTypeMap] of uidMap) {
      for (let [key, value] of chatTypeMap) {
        const tempDynamicList = dynamicList[key] || [];
        const willPushDynamicList: any[] = [];

        const printedList = new Set(); // 已打印的动态列表
        for (let dynamicItem of tempDynamicList) {
          let author = dynamicItem?.modules?.module_author || {};
          if (!printedList.has(author?.mid)) {
            logger.info(`正在检测B站动态 [ ${author?.name} : ${author?.mid} ]`);
            printedList.add(author?.mid);
          }
          if (!author?.pub_ts) continue; // 如果动态没有发布时间，跳过当前循环
          if (Number(now - author.pub_ts) > interval) {
            logger.debug(`超过间隔，跳过  [ ${author?.name} : ${author?.mid} ] ${author?.pub_time} 的动态`);
            continue;
          } // 如果超过推送时间间隔，跳过当前循环
          if (dynamicItem.type === 'DYNAMIC_TYPE_FORWARD' && !biliConfigData.pushTransmit) continue; // 如果关闭了转发动态的推送，跳过当前循环
          willPushDynamicList.push(dynamicItem);
        }
        printedList.clear();

        const pushMapInfo = value || {}; // 获取当前 uid 对应的推送信息

        const { chatIds, bot_id, upName, type } = pushMapInfo;

        // 遍历待推送的动态数组，发送动态消息
        for (let pushDynamicData of willPushDynamicList) {
          if (chatIds && chatIds.length) {
            for (let chatId of chatIds) {
              if (type && type.length && !type.includes(pushDynamicData.type)) continue; // 如果禁用了某类型的动态推送，跳过当前循环
              await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType); // 发送动态消息
              await this.randomDelay(1000, 2000); // 随机延时1-2秒
            }
          }
        }
      }
    }
  }

  /**
   * 发送动态消息
   * @param chatId 聊天 ID
   * @param bot_id 机器人 ID
   * @param upName 用户名
   * @param pushDynamicData 推送动态数据
   * @param biliConfigData 哔哩配置数据
   * @param chatType 聊天类型
   */
  async sendDynamic(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, biliConfigData: any, chatType: string) {
    const id_str = pushDynamicData.id_str;

    let sended: string | null = null,
      markKey: string = '';
    if (chatType === 'group') {
      markKey = this.groupKey;
      sended = await redis.get(`${markKey}${chatId}:${id_str}`);
    } else if (chatType === 'private') {
      markKey = this.privateKey;
      sended = await redis.get(`${markKey}${chatId}:${id_str}`);
    }
    if (sended) return; // 如果已经发送过，则直接返回

    let liveAtAll: boolean = !!biliConfigData.liveAtAll === true ? true : false; // 直播动态是否@全体成员，默认false
    let liveAtAllCD: number = biliConfigData.liveAtAllCD || 1800; // 直播动态@全体成员 冷却时间CD，默认 30 分钟
    let liveAtAllMark: number | string = await redis.get(`${markKey}${chatId}:liveAtAllMark`); // 直播动态@全体成员标记，默认 0
    // 直播动态@全体成员的群组列表，默认空数组，为空则不进行@全体成员操作
    let liveAtAllGroupList = new Set(
      Array.isArray(biliConfigData?.liveAtAllGroupList) ? Array.from(biliConfigData.liveAtAllGroupList).map(item => String(item)) : []
    );

    if (!!biliConfigData.pushMsgMode) {
      const { data, uid } = await BiliQuery.formatDynamicData(pushDynamicData); // 处理动态数据
      const extentData = { ...data };

      const eval2 = eval;
      let banWords: RegExp = eval2(`/${biliConfigData.banWords.join('|')}/g`); // 构建屏蔽关键字正则表达式
      if (new RegExp(banWords).test(`${extentData?.title}${extentData?.content}`)) {
        return 'return'; // 如果动态包含屏蔽关键字，则直接返回
      }

      let boxGrid: boolean = !!biliConfigData.boxGrid === false ? false : true; // 是否启用九宫格样式，默认为 true
      let isSplit: boolean = !!biliConfigData.isSplit === false ? false : true; // 是否启用分片截图，默认为 true
      let style: string = isSplit ? '' : `.unfold { max-height: ${biliConfigData?.noSplitHeight ?? 7500}px; }`; // 不启用分片截图模式的样式
      let splitHeight: number = biliConfigData?.splitHeight || 8000; // 分片截图高度，默认 8000, 单位 px，启用分片截图时生效

      const urlQrcodeData: string = await QRCode.toDataURL(extentData?.url);
      let renderData: MainProps = this.buildRenderData(extentData, urlQrcodeData, boxGrid);

      const ScreenshotOptionsData: ScreenshotOptions = {
        addStyle: style,
        header: { Referer: 'https://space.bilibili.com/' },
        isSplit: isSplit,
        modelName: 'bilibili',
        SOptions: {
          type: 'webp',
          quality: 98
        },
        saveHtmlfile: false,
        pageSplitHeight: splitHeight
      };

      let imgs: Buffer[] | null = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
      if (!imgs) return;

      redis.set(`${markKey}${chatId}:${id_str}`, '1', { EX: 3600 * 72 }); // 设置已发送标记

      (logger ?? Bot.logger)?.mark('优纪插件：B站动态执行推送');

      if (liveAtAll && !liveAtAllMark && extentData?.type === 'DYNAMIC_TYPE_LIVE_RCMD' && liveAtAllGroupList.has(String(chatId))) {
        try {
          await this.sendMessage(chatId, bot_id, chatType, segment.at('all'));
          await redis.set(`${markKey}${chatId}:liveAtAllMark`, 1, { EX: liveAtAllCD }); // 设置直播动态@全体成员标记为 1
        } catch (error) {
          logger.error(`直播动态发送@全体成员失败，请检查 <机器人> 是否有 [管理员权限] 或 [聊天平台是否支持] ：${error}`);
          await this.sendMessage(chatId, bot_id, chatType, ['直播动态发送@全体成员失败，请检查权限或平台是否支持']);
        }
      }

      for (let i = 0; i < imgs.length; i++) {
        const image: Buffer = imgs[i];
        await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
        await this.randomDelay(1000, 2000); // 随机延时1-2秒
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // 休眠1秒
    } else {
      const dynamicMsg = await BiliQuery.formatTextDynamicData(upName, pushDynamicData, false, biliConfigData); // 构建图文动态消息

      redis.set(`${markKey}${chatId}:${id_str}`, '1', { EX: 3600 * 72 }); // 设置已发送标记

      if (dynamicMsg === undefined || dynamicMsg === 'continue') {
        return 'return'; // 如果动态消息构建失败，则直接返回
      }

      const getBanWords: string[] | null = biliConfigData?.banWords;
      if (getBanWords && Array.isArray(getBanWords) && getBanWords.length > 0) {
        const banWords = new RegExp(getBanWords.join('|'), 'g'); // 构建屏蔽关键字正则表达式
        if (banWords.test(dynamicMsg.msg.join(''))) {
          return 'return'; // 如果动态消息包含屏蔽关键字，则直接返回
        }
      }

      let mergeTextPic: boolean = !!biliConfigData.mergeTextPic === false ? false : true; // 是否合并文本和图片，默认为 true
      if (mergeTextPic === true) {
        const mergeMsg = [...dynamicMsg.msg, ...dynamicMsg.pics];
        if (liveAtAll && !liveAtAllMark && dynamicMsg.dynamicType === 'DYNAMIC_TYPE_LIVE_RCMD' && liveAtAllGroupList.has(String(chatId))) {
          try {
            await this.sendMessage(chatId, bot_id, chatType, segment.at('all'));
            await redis.set(`${markKey}${chatId}:liveAtAllMark`, 1, { EX: liveAtAllCD }); // 设置直播动态@全体成员标记为 1
          } catch (error) {
            logger.error(`直播动态发送@全体成员失败，请检查 <机器人> 是否有 [管理员权限] 或 [聊天平台是否支持] ：${error}`);
            await this.sendMessage(chatId, bot_id, chatType, ['直播动态发送@全体成员失败，请检查权限或平台是否支持']);
          }
        }
        await this.sendMessage(chatId, bot_id, chatType, mergeMsg);
      } else {
        if (liveAtAll && !liveAtAllMark && dynamicMsg.dynamicType === 'DYNAMIC_TYPE_LIVE_RCMD' && liveAtAllGroupList.has(String(chatId))) {
          try {
            await this.sendMessage(chatId, bot_id, chatType, segment.at('all'));
            await redis.set(`${markKey}${chatId}:liveAtAllMark`, 1, { EX: liveAtAllCD }); // 设置直播动态@全体成员标记为 1
          } catch (error) {
            logger.error(`直播动态发送@全体成员失败，请检查 <机器人> 是否有 [管理员权限] 或 [聊天平台是否支持] ：${error}`);
            await this.sendMessage(chatId, bot_id, chatType, ['直播动态发送@全体成员失败，请检查权限或平台是否支持']);
          }
        }
        await this.sendMessage(chatId, bot_id, chatType, dynamicMsg.msg);
        const pics = dynamicMsg.pics;
        if (pics && pics.length > 0) {
          for (let i = 0; i < pics.length; i++) {
            await this.sendMessage(chatId, bot_id, chatType, pics[i]);
            await this.randomDelay(1000, 2000); // 随机延时1-2秒
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
    if (extentData.orig && extentData.orig.length !== 0) {
      return {
        data: {
          appName: 'bilibili',
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
              category: extentData?.orig?.data?.category
            }
          }
        }
      };
    } else {
      return {
        data: {
          appName: 'bilibili',
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
          category: extentData?.category
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
    const dynamicMsg = await renderPage(uid, 'MainPage', renderData, ScreenshotOptionsData); // 渲染动态卡片
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
    if (chatType === 'group') {
      await (Bot[bot_id] ?? Bot)
        ?.pickGroup(String(chatId))
        .sendMsg(message) // 发送群聊
        .catch((error: any) => {
          (logger ?? Bot.logger)?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
        });
    } else if (chatType === 'private') {
      await (Bot[bot_id] ?? Bot)
        ?.pickFriend(String(chatId))
        .sendMsg(message)
        .catch((error: any) => {
          (logger ?? Bot.logger)?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
        }); // 发送好友私聊
    }
  }

  /**
   * 随机延时
   * @param min 最小延时时间
   * @param max 最大延时时间
   */
  async randomDelay(min: number, max: number) {
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
  }
}
