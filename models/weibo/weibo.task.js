import QRCode from 'qrcode';
import Config from '../../utils/config.js';
import { renderPage } from '../../utils/image.js';
import { WeiboGetWebData } from './weibo.get.web.data.js';
import { WeiboQuery } from './weibo.query.js';

class WeiboTask {
    taskName;
    groupKey;
    privateKey;
    e;
    constructor(e) {
        this.taskName = "weiboTask";
        this.groupKey = "Yz:yuki:weibo:upPush:group:";
        this.privateKey = "Yz:yuki:weibo:upPush:private:";
    }
    async runTask() {
        let weiboConfigData = await Config.getUserConfig("weibo", "config");
        let weiboPushData = await Config.getUserConfig("weibo", "push");
        let interval = weiboConfigData.interval || 7200;
        const uidMap = new Map();
        const dynamicList = {};
        await this.processWeiboData(weiboPushData, uidMap, dynamicList);
        let now = Date.now() / 1000;
        await this.pushDynamicMessages(uidMap, dynamicList, now, interval, weiboConfigData);
    }
    async processWeiboData(weiboPushData, uidMap, dynamicList) {
        for (let chatType in weiboPushData) {
            if (!uidMap.has(chatType)) {
                uidMap.set(chatType, new Map());
            }
            const chatTypeMap = uidMap.get(chatType);
            for (let chatId in weiboPushData[chatType]) {
                const subUpsOfChat = weiboPushData[chatType][chatId] || [];
                for (let subInfoOfup of subUpsOfChat) {
                    const resp = await new WeiboGetWebData().getBloggerDynamicList(subInfoOfup.uid);
                    if (resp) {
                        const dynamicData = resp || [];
                        dynamicList[subInfoOfup.uid] = dynamicData;
                    }
                    const chatIds = Array.from(new Set([...Object((chatTypeMap.get(subInfoOfup.uid) && chatTypeMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
                    const bot_id = subInfoOfup.bot_id || [];
                    const { name, type } = subInfoOfup;
                    chatTypeMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type });
                    await this.randomDelay(1000, 4000);
                }
            }
        }
    }
    async pushDynamicMessages(uidMap, dynamicList, now, interval, weiboConfigData) {
        for (let [chatType, chatTypeMap] of uidMap) {
            for (let [key, value] of chatTypeMap) {
                const tempDynamicList = dynamicList[key] || [];
                const willPushDynamicList = [];
                const printedList = new Set();
                for (let dynamicItem of tempDynamicList) {
                    let raw_post = dynamicItem || {};
                    let user = raw_post?.mblog?.user || {};
                    if (!printedList.has(user?.id)) {
                        logger.info(`正在检测微博动态 [ ${user?.screen_name} : ${user?.id} ]`);
                        printedList.add(user?.id);
                    }
                    if (!raw_post?.mblog?.created_at)
                        continue;
                    if (Number(now - (WeiboQuery.getDynamicCreatetDate(raw_post) / 1000)) > interval) {
                        logger.debug(`超过间隔，跳过   [ ${user?.screen_name} : ${user?.id} ] ${raw_post?.mblog?.created_at} 的动态`);
                        continue;
                    }
                    if (dynamicItem.type === "DYNAMIC_TYPE_FORWARD" && !weiboConfigData.pushTransmit)
                        continue;
                    willPushDynamicList.push(dynamicItem);
                }
                printedList.clear();
                const pushMapInfo = value || {};
                const { chatIds, bot_id, upName, type } = pushMapInfo;
                for (let pushDynamicData of willPushDynamicList) {
                    if (chatIds && chatIds.length) {
                        for (let chatId of chatIds) {
                            if (type && type.length && !type.includes(pushDynamicData.type))
                                continue;
                            await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, weiboConfigData, chatType);
                            await this.randomDelay(2000, 10500);
                        }
                    }
                }
            }
        }
    }
    async sendDynamic(chatId, bot_id, upName, pushDynamicData, weiboConfigData, chatType) {
        const id_str = WeiboQuery.getDynamicId(pushDynamicData);
        let sended, markKey;
        if (chatType === "group") {
            markKey = this.groupKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        else if (chatType === "private") {
            markKey = this.privateKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        if (sended)
            return;
        if (!!weiboConfigData.pushMsgMode) {
            const { data, uid } = await WeiboQuery.formatDynamicData(pushDynamicData);
            const eval2 = eval;
            let banWords = eval2(`/${weiboConfigData.banWords.join("|")}/g`);
            if (new RegExp(banWords).test(`${data?.title}${data?.content}`)) {
                return "return";
            }
            let boxGrid = !!weiboConfigData.boxGrid === false ? false : true;
            let isSplit = !!weiboConfigData.isSplit === false ? false : true;
            let style = isSplit ? '' : '.unfold { height: 7500px; }';
            const extentData = { ...data };
            const urlQrcodeData = await QRCode.toDataURL(extentData?.url);
            let renderData = this.buildRenderData(extentData, urlQrcodeData, boxGrid);
            const ScreenshotOptionsData = {
                addStyle: style,
                header: { 'Referer': 'https://weibo.com' },
                isSplit: isSplit,
                modelName: 'weibo',
                SOptions: {
                    type: 'webp',
                    quality: 98,
                },
                saveHtmlfile: false,
            };
            let imgs = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
            if (!imgs)
                return;
            redis.set(`${markKey}${chatId}:${id_str}`, "1", { EX: 3600 * 10 });
            (logger ?? Bot.logger)?.mark("优纪插件：B站动态执行推送");
            for (let i = 0; i < imgs.length; i++) {
                const image = imgs[i];
                await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
                await this.randomDelay(2000, 6500);
            }
            await this.randomDelay(1000, 2000);
        }
        else {
            const dynamicMsg = await WeiboQuery.formatTextDynamicData(upName, pushDynamicData, false, weiboConfigData);
            redis.set(`${markKey}${chatId}:${id_str}`, "1", { EX: 3600 * 10 });
            if (dynamicMsg == "continue" || dynamicMsg == false) {
                return "return";
            }
            if (weiboConfigData.banWords.length > 0) {
                const banWords = new RegExp(weiboConfigData.banWords.join("|"), "g");
                if (banWords.test(dynamicMsg.join(""))) {
                    return "return";
                }
            }
            await this.sendMessage(chatId, bot_id, chatType, dynamicMsg);
            await this.randomDelay(1000, 2000);
        }
    }
    buildRenderData(extentData, urlQrcodeData, boxGrid) {
        if (extentData.orig && (extentData.orig).length !== 0) {
            return {
                data: {
                    appName: "weibo",
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
        }
        else {
            return {
                data: {
                    appName: "weibo",
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
    async renderDynamicCard(uid, renderData, ScreenshotOptionsData) {
        const dynamicMsg = await renderPage(uid, "MainPage", renderData, ScreenshotOptionsData);
        if (dynamicMsg !== false) {
            return dynamicMsg.img;
        }
        else {
            return null;
        }
    }
    async sendMessage(chatId, bot_id, chatType, message) {
        if (chatType === "group") {
            await (Bot[bot_id] ?? Bot)?.pickGroup(String(chatId)).sendMsg(message)
                .catch((error) => {
                (logger ?? Bot.logger)?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
        else if (chatType === "private") {
            await (Bot[bot_id] ?? Bot)?.pickFriend(String(chatId)).sendMsg(message)
                .catch((error) => {
                (logger ?? Bot.logger)?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
    }
    async randomDelay(min, max) {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
    }
}

export { WeiboTask };
