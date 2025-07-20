import QRCode from 'qrcode';
import Config from '../../utils/config.js';
import { renderPage } from '../../utils/image.js';
import { BilibiliWebDataFetcher } from './bilibili.main.get.web.data.js';
import { readSyncCookie, postGateway } from './bilibili.main.models.js';
import { BiliQuery } from './bilibili.main.query.js';
import { logger, Redis, Segment } from '../../utils/host.js';

class BiliTask {
    taskName;
    groupKey;
    privateKey;
    e;
    constructor(e) {
        this.taskName = 'biliTask';
        this.groupKey = 'Yz:yuki:bili:upPush:group:';
        this.privateKey = 'Yz:yuki:bili:upPush:private:';
    }
    async hendleEventDynamicData(uid, count = 0) {
        let { cookie } = await readSyncCookie();
        const resp = await new BilibiliWebDataFetcher().getBiliDynamicListDataByUid(uid);
        const resjson = await resp?.data;
        if (!resjson || resjson.code !== 0 || resjson.code === -352) {
            await postGateway(cookie);
            if (count < 2) {
                await this.randomDelay(2000, 8000); // 随机延时2-8秒
                await this.hendleEventDynamicData(uid, count + 1);
                logger.error(`获取 ${uid} 动态，Gateway count：${String(count)}`);
            }
            else {
                count = 0;
            }
        }
        return resjson;
    }
    /**
     * 执行动态推送任务
     */
    async runTask() {
        let biliConfigData = await Config.getUserConfig('bilibili', 'config');
        let biliPushData = await Config.getUserConfig('bilibili', 'push');
        let dynamicTimeRange = biliConfigData?.dynamicTimeRange || 7200; // 筛选何时发布的动态，单位为秒，默认2小时内发布的动态
        logger.debug(`当前B站功能配置：${JSON.stringify(biliConfigData)}`);
        const uidMap = new Map(); // 存放group 和 private 对应所属 uid 与推送信息的映射
        const dynamicList = {}; // 存放获取的所有动态，键为 uid，值为动态数组
        await this.processBiliData(biliPushData, biliConfigData, uidMap, dynamicList);
        let now = Date.now() / 1000; // 时间戳（秒）
        // 定义待推送动态消息映射
        const messageMap = new Map();
        await this.makeUidDynamicDataMap(uidMap, dynamicList, now, dynamicTimeRange, biliConfigData, messageMap);
        await this.sendDynamicMessage(messageMap, biliConfigData);
    }
    /**
     * 处理Bilibili数据，获取动态列表并构建 uid 映射
     * @param biliPushData Bilibili推送数据
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param lastLiveStatus 最后直播状态
     */
    async processBiliData(biliPushData, biliConfigData, uidMap, dynamicList) {
        let getDataRandomDelay = biliConfigData?.getDataRandomDelay || 8000; // 获取相邻up动态数据的随机延时间隔
        const requestedDataOfUids = new Map(); // 存放已请求的 uid 映射
        const printedList = new Set(); // 已打印的动态列表
        for (let chatType in biliPushData) {
            // 遍历 group 和 private
            if (!uidMap.has(chatType)) {
                uidMap.set(chatType, new Map());
            }
            const chatTypeMap = uidMap.get(chatType); // 建立当前 chatType (group 或 private) 的 uid 映射
            if (chatTypeMap === undefined)
                continue; // 如果 chatTypeMap 未定义，跳过此次循环
            for (let chatId in biliPushData[chatType]) {
                const subUpsOfChat = Array.prototype.slice.call(biliPushData[chatType][chatId] || []);
                for (let subInfoOfup of subUpsOfChat) {
                    const { uid, bot_id, name, type } = subInfoOfup;
                    let resp;
                    // 检查是否已经请求过该 uid
                    if (!requestedDataOfUids.has(uid)) {
                        if (!printedList.has(uid)) {
                            logger.info(`正在检测B站动态 [ ${name} : ${uid} ]`);
                            printedList.add(uid);
                        }
                        resp = await this.hendleEventDynamicData(uid);
                        if (resp) {
                            if (resp.code === 0) {
                                requestedDataOfUids.set(uid, resp); // 将响应数据存储到映射中
                                const dynamicData = resp.data?.items || [];
                                dynamicList[uid] = dynamicData;
                            }
                            else if (resp.code === -352) {
                                logger.error(`获取 ${uid} 动态失败，resCode：-352，请待下次任务自动重试`);
                                return;
                            }
                            else if (resp.code !== 0) {
                                logger.error(`获取 ${uid} 动态失败，resCode：${resp.code}，请待下次任务自动重试`);
                                return;
                            }
                        }
                        else {
                            logger.error(`获取 ${uid} 动态失败，无响应数据，请待下次任务自动重试`);
                            return;
                        }
                    }
                    if (!chatTypeMap.has(uid)) {
                        chatTypeMap.set(uid, new Map());
                    }
                    const botChatMap = chatTypeMap.get(uid);
                    if (!botChatMap.has(bot_id)) {
                        botChatMap.set(bot_id, new Map());
                    }
                    const chatMap = botChatMap.get(bot_id);
                    chatMap.set(chatId, { upName: name, types: type });
                    await this.randomDelay(2000, getDataRandomDelay); // 随机延时
                }
            }
        }
        requestedDataOfUids.clear(); // 清空已请求的 uid 映射
        printedList.clear(); // 清空已打印的动态列表
    }
    /**
     * 构建uid对应动态数据映射
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param now 当前时间戳
     * @param dynamicTimeRange 筛选何时发布的动态
     * @param biliConfigData Bilibili配置数据
     */
    async makeUidDynamicDataMap(uidMap, dynamicList, now, dynamicTimeRange, biliConfigData, messageMap) {
        for (let [chatType, chatTypeMap] of uidMap) {
            for (let [upUid, bot_idMap] of chatTypeMap) {
                const tempDynamicList = dynamicList[upUid] || [];
                const willPushDynamicList = [];
                for (let dynamicItem of tempDynamicList) {
                    let author = dynamicItem?.modules?.module_author || {};
                    if (!author?.pub_ts)
                        continue; // 如果动态没有发布时间，跳过当前循环
                    if (Number(now - author.pub_ts) > dynamicTimeRange) {
                        logger.debug(`超过间隔，跳过  [ ${author?.name} : ${author?.mid} ] ${author?.pub_time} 的动态`);
                        continue;
                    } // 如果超过推送时间间隔，跳过当前循环
                    if (dynamicItem?.type === 'DYNAMIC_TYPE_FORWARD' && !biliConfigData.pushTransmit) {
                        continue;
                    } // 如果关闭了转发动态的推送，跳过当前循环
                    willPushDynamicList.push(dynamicItem);
                }
                // 遍历待推送的动态数组，发送动态消息
                for (let [bot_id, chatIdMap] of bot_idMap) {
                    for (let [chatId, subUpInfo] of chatIdMap) {
                        const { upName, types } = subUpInfo;
                        for (let pushDynamicData of willPushDynamicList) {
                            if (types && types.length > 0 && !types.includes(pushDynamicData.type)) {
                                continue;
                            } // 如果禁用了某类型的动态推送，跳过当前循环
                            await this.makeDynamicMessageMap(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType, messageMap); // 发送动态消息
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
     * @param upName up主用户名
     * @param pushDynamicData 推送动态数据
     * @param biliConfigData 哔哩配置数据
     * @param chatType 聊天类型
     */
    async makeDynamicMessageMap(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType, messageMap) {
        const id_str = pushDynamicData.id_str;
        let sended = null, markKey = '';
        if (chatType === 'group') {
            markKey = this.groupKey;
            sended = await Redis.get(`${markKey}${chatId}:${id_str}`);
        }
        else if (chatType === 'private') {
            markKey = this.privateKey;
            sended = await Redis.get(`${markKey}${chatId}:${id_str}`);
        }
        if (sended)
            return; // 如果已经发送过，则直接返回
        // 判断推送内容模式
        let pushMsgMode = !!biliConfigData.pushMsgMode === false ? 'TEXT' : 'PIC'; // 是否启用图文模式，默认为 PIC 截图模式
        if (pushMsgMode === 'PIC') {
            const { data, uid } = await BiliQuery.formatDynamicData(pushDynamicData); // 处理动态数据
            const extentData = { ...data };
            const getWhiteWords = biliConfigData?.whiteWordslist;
            const getBanWords = biliConfigData?.banWords;
            if (getWhiteWords && Array.isArray(getWhiteWords) && getWhiteWords.length > 0) {
                // 构建白名单关键字正则表达式，转义特殊字符
                const whiteWords = new RegExp(getWhiteWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
                if (!whiteWords.test(`${extentData?.title}${extentData?.content}`)) {
                    return; // 如果动态消息不在白名单中，则直接返回
                }
            }
            else if (getWhiteWords && !Array.isArray(getWhiteWords)) {
                logger.error(`B站动态：Yaml配置文件中，whiteWordslist 字段格式不是数组格式，请检查！`);
            }
            if (getBanWords && Array.isArray(getBanWords) && getBanWords.length > 0) {
                // 构建屏蔽关键字正则表达式，转义特殊字符
                const banWords = new RegExp(getBanWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
                if (banWords.test(`${extentData?.title}${extentData?.content}`)) {
                    return; // 如果动态消息包含屏蔽关键字，则直接返回
                }
            }
            else if (getBanWords && !Array.isArray(getBanWords)) {
                logger.error(`B站动态：Yaml配置文件中，banWords 字段格式不是数组格式，请检查！`);
            }
            let boxGrid = !!biliConfigData.boxGrid === false ? false : true; // 是否启用九宫格样式，默认为 true
            let isSplit = !!biliConfigData.isSplit === false ? false : true; // 是否启用分片截图，默认为 true
            let style = isSplit ? '' : `.unfold { max-height: ${biliConfigData?.noSplitHeight ?? 7500}px; }`; // 不启用分片截图模式的样式
            let splitHeight = biliConfigData?.splitHeight || 8000; // 分片截图高度，默认 8000, 单位 px，启用分片截图时生效
            const urlQrcodeData = await QRCode.toDataURL(extentData?.url);
            let renderData = this.buildRenderData(extentData, urlQrcodeData, boxGrid);
            const ScreenshotOptionsData = {
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
            let imgs = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
            if (!imgs)
                return; // 如果渲染失败，则直接返回
            await this.addMessageToMap(messageMap, chatType, bot_id, chatId, 'SINGLE', id_str, extentData?.type, imgs.map(img => Segment.image(img)));
        }
        else {
            const dynamicMsg = await BiliQuery.formatTextDynamicData(upName, pushDynamicData, false, biliConfigData); // 构建图文动态消息
            if (dynamicMsg === undefined || dynamicMsg === 'continue') {
                return 'return'; // 如果动态消息构建失败，则直接返回
            }
            const getWhiteWords = biliConfigData?.whiteWordslist;
            const getBanWords = biliConfigData?.banWords;
            if (getWhiteWords && Array.isArray(getWhiteWords) && getWhiteWords.length > 0) {
                // 构建白名单关键字正则表达式，转义特殊字符
                const whiteWords = new RegExp(getWhiteWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
                if (!whiteWords.test(dynamicMsg.msg.join(''))) {
                    return; // 如果动态消息不在白名单中，则直接返回
                }
            }
            else if (getWhiteWords && !Array.isArray(getWhiteWords)) {
                logger.error(`B站动态：Yaml配置文件中，whiteWordslist 字段格式不是数组格式，请检查！`);
            }
            if (getBanWords && Array.isArray(getBanWords) && getBanWords.length > 0) {
                // 构建屏蔽关键字正则表达式，转义特殊字符
                const banWords = new RegExp(getBanWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
                if (banWords.test(dynamicMsg.msg.join(''))) {
                    return 'return'; // 如果动态消息包含屏蔽关键字，则直接返回
                }
            }
            else if (getBanWords && !Array.isArray(getBanWords)) {
                logger.error(`B站动态：Yaml配置文件中，banWords 字段格式不是数组格式，请检查！`);
            }
            let mergeTextPic = !!biliConfigData.mergeTextPic === false ? false : true; // 是否合并文本和图片，默认为 true
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
        }
        else {
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
     * @param biliConfigData 哔哩配置数据
     */
    async sendDynamicMessage(messageMap, biliConfigData) {
        let liveAtAll = !!biliConfigData.liveAtAll === true ? true : false; // 直播动态是否@全体成员，默认false
        let liveAtAllCD = biliConfigData.liveAtAllCD || 1800; // 直播动态@全体成员 冷却时间CD，默认 30 分钟
        let forwardSendDynamic = biliConfigData.forwardSendDynamic === 0 || biliConfigData.forwardSendDynamic === false ? false : true; // 转发动态是否合并发送，默认 true
        // 直播动态@全体成员的群组/好友列表，默认空数组，为空则不进行@全体成员操作
        let liveAtAllGroupList = new Set(Array.isArray(biliConfigData?.liveAtAllGroupList) ? Array.from(biliConfigData.liveAtAllGroupList).map(item => String(item)) : []);
        const LogMark = new Set(); // 日志mark
        for (const [chatType, botMap] of messageMap) {
            for (const [bot_id, chatMap] of botMap) {
                for (const [chatId, messageCombinationList] of chatMap) {
                    // 区分群聊和私聊
                    let markKey = chatType === 'group' ? this.groupKey : this.privateKey;
                    if (!LogMark.has('1')) {
                        global?.logger?.mark('优纪插件: B站动态执行推送');
                        LogMark.add('1');
                    }
                    let liveAtAllMark = await Redis.get(`${markKey}${chatId}:liveAtAllMark`); // 直播动态@全体成员标记，默认 0
                    const hasLiveDynamic = messageCombinationList.some(m => m.dynamicType === 'DYNAMIC_TYPE_LIVE_RCMD');
                    // 如果开启了直播动态@全体成员
                    if (liveAtAll && !liveAtAllMark && hasLiveDynamic && liveAtAllGroupList.has(String(chatId))) {
                        try {
                            await this.sendMsgApi(chatId, bot_id, chatType, [Segment.at('all')]);
                            await Redis.set(`${markKey}${chatId}:liveAtAllMark`, 1, { EX: liveAtAllCD }); // 设置直播动态@全体成员标记为 1
                        }
                        catch (error) {
                            logger.error(`直播动态发送@全体成员失败，请检查 <机器人> 是否有 [管理员权限] 或 [聊天平台是否支持] ：${error}`);
                            let liveAtAllErrMsg = !!biliConfigData.liveAtAllErrMsg === false ? false : true; // 直播动态@全体成员失败是否发送错误提示消息，默认 false
                            if (liveAtAllErrMsg) {
                                await this.sendMsgApi(chatId, bot_id, chatType, ['直播动态发送@全体成员失败，请检查权限或平台是否支持']);
                            }
                        }
                    }
                    // 统计图片数量和文字长度
                    let imageCount = 0;
                    let textLength = 0;
                    for (const messageCombination of messageCombinationList) {
                        const { messages } = messageCombination;
                        for (const msg of messages) {
                            if (typeof msg === 'object' && msg.type === 'image') {
                                imageCount++;
                            }
                            else if (typeof msg === 'string') {
                                textLength += msg.length;
                            }
                        }
                    }
                    // 满足条件才使用合并转发
                    const useForward = imageCount > (biliConfigData?.maxPicsForSingleMsg ?? 2) || textLength > (biliConfigData?.maxTextLengthForSingleMsg ?? 300);
                    if (forwardSendDynamic && useForward) {
                        const forwardNodes = [];
                        // 合并所有消息
                        const forwardSendMardKeyList = [];
                        forwardNodes.push({
                            nickname: '优纪酱',
                            user_id: String(80000000),
                            message: ['有新的B站动态了~'],
                            time: Date.now()
                        });
                        for (const messageCombination of messageCombinationList) {
                            const { sendMode, dynamicUUid_str, dynamicType, messages } = messageCombination;
                            const sendMarkKey = `${markKey}${chatId}:${dynamicUUid_str}`;
                            // 原子性设置标记，防止并发重复
                            const setResult = await Redis.set(sendMarkKey, '1', { NX: true, EX: 3600 * 72 });
                            if (!setResult) {
                                continue; // 已有标记，跳过
                            }
                            forwardSendMardKeyList.push(sendMarkKey); // 收集合并转发的标记键
                            // 每条动态一个 node
                            forwardNodes.push({
                                nickname: '匿名消息',
                                user_id: String(80000000),
                                message: messages,
                                time: Date.now()
                            });
                        }
                        // 尝试合并转发动态
                        if ((await this.sendMsgApi(chatId, bot_id, chatType, '优纪酱B站动态通知~')) &&
                            (await this.sendForwardMsgApi(chatId, bot_id, chatType, forwardNodes))) {
                            await this.randomDelay(1000, 2000);
                            continue; // 合并转发成功，跳过后续单条发送逻辑
                        }
                        else {
                            for (const sendMarkKey of forwardSendMardKeyList) {
                                await Redis.del(sendMarkKey); // 发送消息失败，删除合并转发成功标记
                            }
                        }
                    }
                    // 合并转发失败，回退为原有方式
                    for (const messageCombination of messageCombinationList) {
                        const { sendMode, dynamicUUid_str, dynamicType, messages } = messageCombination;
                        const sendMarkKey = `${markKey}${chatId}:${dynamicUUid_str}`;
                        // 原子性设置标记，防止并发重复
                        const setResult = await Redis.set(sendMarkKey, '1', { NX: true, EX: 3600 * 72 });
                        if (!setResult) {
                            continue; // 已有标记，跳过
                        }
                        let sendSuccess = true;
                        if (sendMode === 'SINGLE') {
                            for (let i = 0; i < messages.length; i++) {
                                if (!(await this.sendMsgApi(chatId, bot_id, chatType, messages[i]))) {
                                    sendSuccess = false;
                                    break;
                                }
                            }
                            if (!sendSuccess) {
                                await Redis.del(sendMarkKey); // 失败删除标记
                            }
                            else {
                                await this.randomDelay(1000, 2000);
                            }
                        }
                        else if (sendMode === 'MERGE') {
                            if (!(await this.sendMsgApi(chatId, bot_id, chatType, messages))) {
                                await Redis.del(sendMarkKey); // 失败删除标记
                            }
                            await this.randomDelay(1000, 2000);
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
    async sendMsgApi(chatId, bot_id, chatType, message) {
        try {
            if (chatType === 'group') {
                await (Bot[bot_id] ?? Bot)?.pickGroup(String(chatId)).sendMsg(message); // 发送群聊
            }
            else if (chatType === 'private') {
                await (Bot[bot_id] ?? Bot)?.pickFriend(String(chatId)).sendMsg(message); // 发送好友私聊
            }
            return true; // 发送成功
        }
        catch (error) {
            global?.logger?.error(`${chatType === 'group' ? '群聊' : '私聊'} ${chatId} 消息发送失败：${JSON.stringify(error)}`);
            return false; // 发送失败
        }
    }
    /**
     * 发送合并转发消息
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     * @returns 是否发送成功
     */
    async sendForwardMsgApi(chatId, bot_id, chatType, forwardNodes) {
        const forwardMsg = await Bot.makeForwardMsg(forwardNodes);
        try {
            if (chatType === 'group') {
                await (Bot[bot_id] ?? Bot)?.pickGroup(String(chatId)).sendMsg(forwardMsg); // 发送群聊合并转发
            }
            else if (chatType === 'private') {
                await (Bot[bot_id] ?? Bot)?.pickFriend(String(chatId)).sendMsg(forwardMsg); // 发送好友私聊合并转发
            }
            return true; // 发送成功
        }
        catch (error) {
            global?.logger?.error(`${chatType === 'group' ? '群聊' : '私聊'} ${chatId} 合并转发消息发送失败：${JSON.stringify(error)}`);
            return false; // 发送失败
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

export { BiliTask };
