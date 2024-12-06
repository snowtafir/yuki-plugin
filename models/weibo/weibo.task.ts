import QRCode from 'qrcode';
import { MainProps } from '@/components/dynamic/MainPage';
import Config from '@/utils/config';
import { renderPage } from '@/utils/image';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
import { WeiboGetWebData } from '@/models/weibo/weibo.get.web.data';
import { WeiboQuery } from '@/models/weibo/weibo.query';

declare const Bot: any, redis: any, segment: any;

declare const logger: any;

export class WeiboTask {
  taskName: string;
  groupKey: string;
  privateKey: string;
  e?: any;
  constructor(e?) {
    this.taskName = 'weiboTask';
    this.groupKey = 'Yz:yuki:weibo:upPush:group:';
    this.privateKey = 'Yz:yuki:weibo:upPush:private:';
  }

  async runTask() {
    let weiboConfigData = await Config.getUserConfig('weibo', 'config');
    let weiboPushData = await Config.getUserConfig('weibo', 'push');
    let interval: number = weiboConfigData.interval || 7200; // 推送间隔时间，单位为秒，默认2小时
    const uidMap: Map<any, Map<string, any>> = new Map(); // 存放group 和 private 对应所属 uid 与推送信息的映射
    const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组

    await this.processWeiboData(weiboPushData, uidMap, dynamicList);

    let now: number = Date.now() / 1000; // 当前时间戳（秒）
    await this.pushDynamicMessages(uidMap, dynamicList, now, interval, weiboConfigData);
  }

  /**
   * 处理微博数据，获取动态列表并构建 uid 映射
   * @param weiboPushData 微博推送数据
   * @param uidMap uid 映射
   * @param dynamicList 动态列表
   */
  async processWeiboData(
    weiboPushData: {
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
    uidMap: Map<any, Map<string, any>>,
    dynamicList: any
  ) {
    const requestedDataOfUids = new Map<string, any>(); // 存放已请求的 uid 映射
    for (let chatType in weiboPushData) {
      // 遍历 group 和 private

      if (!uidMap.has(chatType)) {
        uidMap.set(chatType, new Map());
      }
      const chatTypeMap = uidMap.get(chatType); // 建立当前 chatType (group 或 private) 的 uid 映射

      for (let chatId in weiboPushData[chatType]) {
        const subUpsOfChat: { uid: string; bot_id: string[]; name: string; type: string[] }[] = Array.prototype.slice.call(
          weiboPushData[chatType][chatId] || []
        );
        for (let subInfoOfup of subUpsOfChat) {
          let resp: any;
          // 检查是否已经请求过该 uid
          if (requestedDataOfUids.has(subInfoOfup.uid)) {
            resp = requestedDataOfUids.get(subInfoOfup.uid); // 从已请求的映射中获取响应数据
            const dynamicData = resp || [];
            dynamicList[subInfoOfup.uid] = dynamicData;
          } else {
            resp = await await new WeiboGetWebData().getBloggerDynamicList(subInfoOfup.uid); // 获取指定 uid 的动态列表
            if (resp) {
              requestedDataOfUids.set(subInfoOfup.uid, resp); // 将响应数据存储到映射中
              const dynamicData = resp || [];
              dynamicList[subInfoOfup.uid] = dynamicData;
            }
          }

          const chatIds: any[] = Array.from(new Set([...Object((chatTypeMap.get(subInfoOfup.uid) && chatTypeMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
          const bot_id: string[] | number[] = subInfoOfup.bot_id || [];
          const { name, type } = subInfoOfup;
          chatTypeMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type });
          await this.randomDelay(1000, 4000); // 随机延时1-4秒
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
   * @param weiboConfigData 微博配置数据
   */
  async pushDynamicMessages(uidMap: Map<any, Map<string, any>>, dynamicList: any, now: number, interval: number, weiboConfigData: any) {
    for (let [chatType, chatTypeMap] of uidMap) {
      for (let [key, value] of chatTypeMap) {
        const tempDynamicList = dynamicList[key] || [];
        const willPushDynamicList = [];

        const printedList = new Set(); // 已打印的动态列表
        for (let dynamicItem of tempDynamicList) {
          let raw_post = dynamicItem || {};
          let user = raw_post?.mblog?.user || {};
          if (!printedList.has(user?.id)) {
            logger.info(`正在检测微博动态 [ ${user?.screen_name} : ${user?.id} ]`);
            printedList.add(user?.id);
          }
          if (!raw_post?.mblog?.created_at) continue;
          if (Number(now - WeiboQuery.getDynamicCreatetDate(raw_post) / 1000) > interval) {
            logger.debug(`超过间隔，跳过   [ ${user?.screen_name} : ${user?.id} ] ${raw_post?.mblog?.created_at} 的动态`);
            continue;
          } // 如果超过推送时间间隔，跳过当前循环
          if (dynamicItem.type === 'DYNAMIC_TYPE_FORWARD' && !weiboConfigData.pushTransmit) continue; // 如果关闭了转发动态的推送，跳过当前循环
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
              await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, weiboConfigData, chatType); // 发送动态消息
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
   * @param weiboConfigData 微博配置数据
   * @param chatType 聊天类型
   */
  async sendDynamic(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, weiboConfigData: any, chatType: string) {
    const id_str: string = WeiboQuery.getDynamicId(pushDynamicData); // 获取动态 ID

    let sended: string | null, markKey: string;
    if (chatType === 'group') {
      markKey = this.groupKey;
      sended = await redis.get(`${markKey}${chatId}:${id_str}`);
    } else if (chatType === 'private') {
      markKey = this.privateKey;
      sended = await redis.get(`${markKey}${chatId}:${id_str}`);
    }
    if (sended) return; // 如果已经发送过，则直接返回

    if (!!weiboConfigData.pushMsgMode) {
      const { data, uid } = await WeiboQuery.formatDynamicData(pushDynamicData); // 处理动态数据

      const eval2 = eval;
      let banWords: RegExp = eval2(`/${weiboConfigData.banWords.join('|')}/g`); // 构建屏蔽关键字正则表达式
      if (new RegExp(banWords).test(`${data?.title}${data?.content}`)) {
        return 'return'; // 如果动态包含屏蔽关键字，则直接返回
      }

      let boxGrid: boolean = !!weiboConfigData.boxGrid === false ? false : true; // 是否启用九宫格样式，默认为 true
      let isSplit: boolean = !!weiboConfigData.isSplit === false ? false : true; // 是否启用分片截图，默认为 true
      let style: string = isSplit ? '' : `.unfold { max-height: ${weiboConfigData?.noSplitHeight ?? 7500}px; }`; // 不启用分片截图模式的样式
      let splitHeight: number = weiboConfigData?.splitHeight ?? 8000; // 分片截图高度，默认 8000, 单位 px，启用分片截图时生效

      const extentData = { ...data };
      const urlQrcodeData: string = await QRCode.toDataURL(extentData?.url);
      let renderData: MainProps = this.buildRenderData(extentData, urlQrcodeData, boxGrid);

      const ScreenshotOptionsData: ScreenshotOptions = {
        addStyle: style,
        header: { Referer: 'https://weibo.com' },
        isSplit: isSplit,
        modelName: 'weibo',
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

      (logger ?? Bot.logger)?.mark('优纪插件：微博动态执行推送');

      for (let i = 0; i < imgs.length; i++) {
        const image: Buffer = imgs[i];
        await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
        await this.randomDelay(1000, 2000); // 随机延时1-2秒
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // 休眠1秒
    } else {
      const dynamicMsg = await WeiboQuery.formatTextDynamicData(upName, pushDynamicData, false, weiboConfigData); //构建文字动态消息

      redis.set(`${markKey}${chatId}:${id_str}`, '1', { EX: 3600 * 72 }); // 设置已发送标记

      if (dynamicMsg == 'continue') {
        return 'return'; // 如果动态消息构建失败或内部资源获取失败，则直接返回
      }

      if (weiboConfigData.banWords.length > 0) {
        const banWords = new RegExp(weiboConfigData.banWords.join('|'), 'g'); // 构建屏蔽关键字正则表达式
        if (banWords.test(dynamicMsg.msg.join(''))) {
          return 'return'; // 如果动态消息包含屏蔽关键字，则直接返回
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
          appName: 'weibo',
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
          appName: 'weibo',
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
  async renderDynamicCard(uid: string | number, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions): Promise<Buffer[] | null> {
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
        .catch(error => {
          (logger ?? Bot.logger)?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
        });
    } else if (chatType === 'private') {
      await (Bot[bot_id] ?? Bot)
        ?.pickFriend(String(chatId))
        .sendMsg(message)
        .catch(error => {
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
