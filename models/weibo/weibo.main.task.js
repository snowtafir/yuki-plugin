import QRCode from 'qrcode';
import Config from '../../utils/config.js';
import { renderPage } from '../../utils/image.js';
import { WeiboWebDataFetcher } from './weibo.main.get.web.data.js';
import { WeiboQuery } from './weibo.main.query.js';

class WeiboTask {
    taskName;
    groupKey;
    privateKey;
    e;
    constructor(e) {
        this.taskName = 'weiboTask';
        this.groupKey = 'Yz:yuki:weibo:upPush:group:';
        this.privateKey = 'Yz:yuki:weibo:upPush:private:';
    }
    /**
     * 执行动态推送任务
     */
    async runTask() {
        let weiboConfigData = await Config.getUserConfig('weibo', 'config');
        let weiboPushData = await Config.getUserConfig('weibo', 'push');
        let dynamicTimeRange = weiboConfigData.dynamicTimeRange || 7200; // 筛选何时发布的动态，单位为秒，默认2小时内发布的动态
        logger.debug(`当前微博功能配置：${JSON.stringify(weiboConfigData)}`);
        const uidMap = new Map(); // 存放group 和 private 对应所属 uid 与推送信息的映射
        const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组
        await this.processWeiboData(weiboPushData, uidMap, dynamicList);
        let now = Date.now() / 1000; // 当前时间戳（秒）
        // 定义待推送动态消息映射
        const messageMap = new Map();
        await this.makeUidDynamicDataMap(uidMap, dynamicList, now, dynamicTimeRange, weiboConfigData, messageMap);
        await this.sendDynamicMessage(messageMap, weiboConfigData);
    }
    /**
     * 处理微博数据，获取动态列表并构建 uid 映射
     * @param weiboPushData 微博推送数据
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     */
    async processWeiboData(weiboPushData, uidMap, dynamicList) {
        const requestedDataOfUids = new Map(); // 存放已请求的 uid 映射
        for (let chatType in weiboPushData) {
            // 遍历 group 和 private
            if (!uidMap.has(chatType)) {
                uidMap.set(chatType, new Map());
            }
            const chatTypeMap = uidMap.get(chatType); // 建立当前 chatType (group 或 private) 的 uid 映射
            if (chatTypeMap === undefined)
                continue; // 如果 chatTypeMap 未定义，跳过此次循环
            for (let chatId in weiboPushData[chatType]) {
                const subUpsOfChat = Array.prototype.slice.call(weiboPushData[chatType][chatId] || []);
                for (let subInfoOfup of subUpsOfChat) {
                    let resp;
                    // 检查是否已经请求过该 uid
                    if (requestedDataOfUids.has(subInfoOfup.uid)) {
                        resp = requestedDataOfUids.get(subInfoOfup.uid); // 从已请求的映射中获取响应数据
                        const dynamicData = resp || [];
                        dynamicList[subInfoOfup.uid] = dynamicData;
                    }
                    else {
                        resp = await new WeiboWebDataFetcher().getBloggerDynamicList(subInfoOfup.uid); // 获取指定 uid 的动态列表
                        if (resp) {
                            requestedDataOfUids.set(subInfoOfup.uid, resp); // 将响应数据存储到映射中
                            const dynamicData = resp || [];
                            dynamicList[subInfoOfup.uid] = dynamicData;
                        }
                    }
                    const chatIds = Array.from(new Set([...Object((chatTypeMap.get(subInfoOfup.uid) && chatTypeMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
                    const bot_id = subInfoOfup.bot_id || [];
                    const { name, type } = subInfoOfup;
                    chatTypeMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type });
                    await this.randomDelay(1000, 4000); // 随机延时1-4秒
                }
            }
        }
        requestedDataOfUids.clear(); // 清空已请求的映射
    }
    /**
     * 构建uid对应动态数据映射
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param now 当前时间戳
     * @param dynamicTimeRange 筛选何时发布的动态
     * @param weiboConfigData 微博配置数据
     */
    async makeUidDynamicDataMap(uidMap, dynamicList, now, dynamicTimeRange, weiboConfigData, messageMap) {
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
                    if (!raw_post?.mblog?.created_at)
                        continue;
                    if (Number(now - WeiboQuery.getDynamicCreatetDate(raw_post) / 1000) > dynamicTimeRange) {
                        logger.debug(`超过间隔，跳过   [ ${user?.screen_name} : ${user?.id} ] ${raw_post?.mblog?.created_at} 的动态`);
                        continue;
                    } // 如果超过推送时间间隔，跳过当前循环
                    if (dynamicItem.type === 'DYNAMIC_TYPE_FORWARD' && !weiboConfigData.pushTransmit)
                        continue; // 如果关闭了转发动态的推送，跳过当前循环
                    willPushDynamicList.push(dynamicItem);
                }
                printedList.clear();
                const pushMapInfo = value || {}; // 获取当前 uid 对应的推送信息
                const { chatIds, bot_id, upName, type } = pushMapInfo;
                // 遍历待推送的动态数组，发送动态消息
                for (let pushDynamicData of willPushDynamicList) {
                    if (chatIds && chatIds.length) {
                        for (let chatId of chatIds) {
                            if (type && type.length && !type.includes(pushDynamicData.type))
                                continue; // 如果禁用了某类型的动态推送，跳过当前循环
                            await this.makeDynamicMessageMap(chatId, bot_id, upName, pushDynamicData, weiboConfigData, chatType, messageMap); // 发送动态消息
                            await this.randomDelay(1000, 2000); // 随机延时1-2秒
                        }
                    }
                }
            }
        }
    }
    /**
     * 渲染构建待发送的动态消息数据的映射数组
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param upName 博主用户名
     * @param pushDynamicData 推送动态数据
     * @param weiboConfigData 微博配置数据
     * @param chatType 聊天类型
     * @param messageMap 待发送的动态消息映射
     */
    async makeDynamicMessageMap(chatId, bot_id, upName, pushDynamicData, weiboConfigData, chatType, messageMap) {
        const id_str = WeiboQuery.getDynamicId(pushDynamicData); // 获取动态 ID
        let sended = null, markKey = '';
        if (chatType === 'group') {
            markKey = this.groupKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        else if (chatType === 'private') {
            markKey = this.privateKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        if (sended)
            return; // 如果已经发送过，则直接返回
        if (!!weiboConfigData.pushMsgMode) {
            const { data, uid } = await WeiboQuery.formatDynamicData(pushDynamicData); // 处理动态数据
            const eval2 = eval;
            let banWords = eval2(`/${weiboConfigData.banWords.join('|')}/g`); // 构建屏蔽关键字正则表达式
            if (new RegExp(banWords).test(`${data?.title}${data?.content}`)) {
                return 'return'; // 如果动态包含屏蔽关键字，则直接返回
            }
            let boxGrid = !!weiboConfigData.boxGrid === false ? false : true; // 是否启用九宫格样式，默认为 true
            let isSplit = !!weiboConfigData.isSplit === false ? false : true; // 是否启用分片截图，默认为 true
            let style = isSplit ? '' : `.unfold { max-height: ${weiboConfigData?.noSplitHeight ?? 7500}px; }`; // 不启用分片截图模式的样式
            let splitHeight = weiboConfigData?.splitHeight ?? 8000; // 分片截图高度，默认 8000, 单位 px，启用分片截图时生效
            const extentData = { ...data };
            const urlQrcodeData = await QRCode.toDataURL(extentData?.url);
            let renderData = this.buildRenderData(extentData, urlQrcodeData, boxGrid);
            const ScreenshotOptionsData = {
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
            let imgs = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
            if (!imgs)
                return; // 如果渲染失败，则直接返回
            await this.addMessageToMap(messageMap, chatType, bot_id, chatId, 'SINGLE', id_str, extentData?.type, imgs.map(img => segment.image(img)));
        }
        else {
            const dynamicMsg = await WeiboQuery.formatTextDynamicData(upName, pushDynamicData, false, weiboConfigData); //构建文字动态消息
            if (dynamicMsg === undefined || dynamicMsg === 'continue') {
                return 'return'; // 如果动态消息构建失败或内部资源获取失败，则直接返回
            }
            const getBanWords = weiboConfigData?.banWords;
            if (getBanWords && Array.isArray(getBanWords) && getBanWords.length > 0) {
                const banWords = new RegExp(getBanWords.join('|'), 'g'); // 构建屏蔽关键字正则表达式
                if (banWords.test(dynamicMsg.msg.join(''))) {
                    return 'return'; // 如果动态消息包含屏蔽关键字，则直接返回
                }
            }
            let mergeTextPic = !!weiboConfigData.mergeTextPic === false ? false : true; // 是否合并文字和图片，默认为 true
            //开启了合并文本和图片
            if (mergeTextPic === true) {
                const mergeMsg = [...dynamicMsg.msg, ...dynamicMsg.pics];
                await this.addMessageToMap(messageMap, chatType, bot_id, chatId, 'MERGE', id_str, dynamicMsg.dynamicType, mergeMsg);
            }
            else {
                //不合并文本和图片
                await this.addMessageToMap(messageMap, chatType, bot_id, chatId, 'MERGE', id_str, dynamicMsg.dynamicType, dynamicMsg.msg);
                await this.addMessageToMap(messageMap, chatType, bot_id, chatId, 'SINGLE', id_str, dynamicMsg.dynamicType, dynamicMsg.pics);
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
    buildRenderData(extentData, urlQrcodeData, boxGrid) {
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
        }
        else {
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
    async renderDynamicCard(uid, renderData, ScreenshotOptionsData) {
        const dynamicMsg = await renderPage(uid, 'MainPage', renderData, ScreenshotOptionsData); // 渲染动态卡片
        if (dynamicMsg !== false) {
            return dynamicMsg.img; // 缓存图片数据
        }
        else {
            return null;
        }
    }
    /**
     * 收集消息映射
     * @param messageMap 消息映射
     * @param chatType 聊天类型
     * @param bot_id 机器人 ID
     * @param chatId 聊天 ID
     * @param sendMode 发送模式: SINGLE 逐条发送，MERGE 合并发送
     * @param dynamicUUid_str 动态 UUID
     * @param dynamicType 动态类型
     * @param message 消息内容
     */
    async addMessageToMap(messageMap, chatType, bot_id, chatId, sendMode, dynamicUUid_str, dynamicType, messages) {
        if (!messageMap.has(chatType)) {
            messageMap.set(chatType, new Map());
        }
        const botMap = messageMap.get(chatType);
        if (!botMap?.has(bot_id)) {
            botMap?.set(bot_id, new Map());
        }
        const chatMap = botMap?.get(bot_id);
        if (!chatMap?.has(chatId)) {
            chatMap?.set(chatId, []);
        }
        chatMap?.get(chatId)?.push({ sendMode, dynamicUUid_str, dynamicType, messages });
    }
    /**
     * 推送动态消息
     * @param messageMap 消息映射
     * @param biliConfigData 微博配置数据
     */
    async sendDynamicMessage(messageMap, weiboConfigData) {
        const LogMark = new Set(); // 日志mark
        for (const [chatType, botMap] of messageMap) {
            for (const [bot_id, chatMap] of botMap) {
                for (const [chatId, messageCombinationList] of chatMap) {
                    // 遍历组合消息
                    for (const messageCombination of messageCombinationList) {
                        const { sendMode, dynamicUUid_str, dynamicType, messages } = messageCombination;
                        let sended = null;
                        let markKey = '';
                        if (chatType === 'group') {
                            markKey = this.groupKey;
                            sended = await redis.get(`${markKey}${chatId}:${dynamicUUid_str}`);
                        }
                        else if (chatType === 'private') {
                            markKey = this.privateKey;
                            sended = await redis.get(`${markKey}${chatId}:${dynamicUUid_str}`);
                        }
                        const sendMarkKey = `${markKey}${chatId}:${dynamicUUid_str}`;
                        if (sended) {
                            continue; // 如果已经发送过，则直接跳过
                        }
                        if (!LogMark.has('1')) {
                            global?.logger?.mark('优纪插件: B站动态执行推送');
                            LogMark.add('1');
                        }
                        if (sendMode === 'SINGLE') {
                            for (let i = 0; i < messages.length; i++) {
                                await this.sendMessageApi(chatId, bot_id, chatType, messages[i]);
                            }
                            await redis.set(sendMarkKey, '1', { EX: 3600 * 72 }); // 发送成功后设置标记
                            await this.randomDelay(1000, 2000); // 随机延时1-2秒
                        }
                        else if (sendMode === 'MERGE') {
                            await this.sendMessageApi(chatId, bot_id, chatType, messages);
                            await redis.set(sendMarkKey, '1', { EX: 3600 * 72 }); // 发送成功后设置标记
                        }
                    }
                }
            }
        }
        LogMark.clear(); // 清空日志mark
    }
    /**
     * 发送消息api
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     */
    async sendMessageApi(chatId, bot_id, chatType, message) {
        if (chatType === 'group') {
            await (Bot[bot_id] ?? Bot)
                ?.pickGroup(String(chatId))
                .sendMsg(message) // 发送群聊
                .catch(error => {
                global?.logger?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
        else if (chatType === 'private') {
            await (Bot[bot_id] ?? Bot)
                ?.pickFriend(String(chatId))
                .sendMsg(message)
                .catch(error => {
                global?.logger?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
            }); // 发送好友私聊
        }
    }
    /**
     * 随机延时
     * @param min 最小延时时间
     * @param max 最大延时时间
     */
    async randomDelay(min, max) {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
    }
}

export { WeiboTask };
