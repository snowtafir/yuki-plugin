import QRCode from 'qrcode';
import Config from '../../utils/config.js';
import Image from '../../utils/image.js';
import { BiliGetWebData } from './bilibili.get.web.data.js';
import { readSyncCookie, postGateway } from './bilibili.models.js';
import { BiliQuery } from './bilibili.query.js';

class BiliTask {
    taskName;
    key;
    e;
    constructor(e) {
        this.taskName = "biliTask";
        this.key = "Yz:yuki:bili:upPush:";
    }
    async hendleEventDynamicData(uid, count = 0) {
        const resp = await new BiliGetWebData().getBiliDynamicListDataByUid(uid);
        const resjson = await resp.data;
        let { cookie } = await readSyncCookie();
        if (resjson.code === 0) {
            return resjson;
        }
        else if (resjson.code === -352) {
            await postGateway(cookie);
            if (count < 3) {
                await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (10500 - 2000 + 1) + 2000)));
                await this.hendleEventDynamicData(uid, count + 1);
                logger.error(`获取 ${uid} 动态，Gateway count：${String(count)}`);
            }
            else {
                count = 0;
                return resjson;
            }
        }
        else if (resjson.code !== 0) {
            return resjson;
        }
    }
    async runTask() {
        let biliConfigData = await Config.getUserConfig("bilibili", "config");
        let biliPushData = await Config.getUserConfig("bilibili", "push");
        let interval = biliConfigData.interval || 7200;
        let lastLiveStatus = JSON.parse(await redis.get("yuki:bililive:lastlivestatus")) || {};
        const uidMap = new Map();
        const dynamicList = {};
        await this.processBiliData(biliPushData, uidMap, dynamicList, lastLiveStatus);
        let now = Date.now() / 1000;
        await this.pushDynamicMessages(uidMap, dynamicList, now, interval, biliConfigData);
    }
    async processBiliData(biliPushData, uidMap, dynamicList, lastLiveStatus) {
        for (let chatType in biliPushData) {
            for (let chatId in biliPushData[chatType]) {
                const subUpsOfChat = biliPushData[chatType][chatId] || [];
                for (let subInfoOfup of subUpsOfChat) {
                    if (!lastLiveStatus[subInfoOfup.uid]) {
                        lastLiveStatus[subInfoOfup.uid] = 0;
                    }
                    const resp = await this.hendleEventDynamicData(subInfoOfup.uid);
                    if (resp) {
                        if (resp.code === 0) {
                            const dynamicData = resp.data?.items || [];
                            dynamicList[subInfoOfup.uid] = dynamicData;
                        }
                        else if (resp.code === -352) {
                            logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：-352`);
                            continue;
                        }
                        else if (resp.code !== 0) {
                            logger.error(`获取 ${subInfoOfup.uid} 动态失败，resCode：${resp.code}`);
                            return;
                        }
                    }
                    else {
                        logger.error(`获取 ${subInfoOfup.uid} 动态失败，resp 为空`);
                        return;
                    }
                    const chatIds = Array.from(new Set([...Object((uidMap.get(subInfoOfup.uid) && uidMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
                    const bot_id = subInfoOfup.bot_id || [];
                    const { name, type } = subInfoOfup;
                    uidMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type, chatType });
                    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (8000 - 2000 + 1) + 2000)));
                }
            }
        }
    }
    async pushDynamicMessages(uidMap, dynamicList, now, interval, biliConfigData) {
        for (let [key, value] of uidMap) {
            const tempDynamicList = dynamicList[key] || [];
            const willPushDynamicList = [];
            for (let dynamicItem of tempDynamicList) {
                let author = dynamicItem?.modules?.module_author || {};
                logger.info(`正在检测B站动态 [ ${author?.name} : ${author?.mid} ]`);
                if (!author?.pub_ts)
                    continue;
                if (Number(now - author.pub_ts) > interval) {
                    logger.info(`超过间隔，跳过  [ ${author?.name} : ${author?.mid} ] ${author?.pub_time} 的动态`);
                    continue;
                }
                if (dynamicItem.type === "DYNAMIC_TYPE_FORWARD" && !biliConfigData.pushTransmit)
                    continue;
                willPushDynamicList.push(dynamicItem);
            }
            const pushMapInfo = value || {};
            const { chatIds, bot_id, upName, type, chatType } = pushMapInfo;
            for (let pushDynamicData of willPushDynamicList) {
                if (chatIds && chatIds.length) {
                    for (let chatId of chatIds) {
                        if (type && type.length && !type.includes(pushDynamicData.type))
                            continue;
                        await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType);
                        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 2000)));
                    }
                }
            }
        }
    }
    async sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType) {
        const id_str = pushDynamicData.id_str;
        let sended = await redis.get(`${this.key}${chatId}:${id_str}`);
        if (sended)
            return;
        if (!!biliConfigData.pushMsgMode) {
            const { data, uid } = await BiliQuery.formatDynamicData(pushDynamicData);
            const extentData = { ...data };
            const eval2 = eval;
            let banWords = eval2(`/${biliConfigData.banWords.join("|")}/g`);
            if (new RegExp(banWords).test(`${extentData?.title}${extentData?.content}`)) {
                return "return";
            }
            let boxGrid = !!biliConfigData.boxGrid === false ? false : true;
            let isSplit = !!biliConfigData.isSplit === false ? false : true;
            let style = isSplit ? '' : '.unfold { height: 7500px; }';
            const urlQrcodeData = await QRCode.toDataURL(extentData?.url);
            let renderData = this.buildRenderData(extentData, urlQrcodeData, boxGrid);
            const ScreenshotOptionsData = {
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
            let imgs = await this.renderDynamicCard(uid, renderData, ScreenshotOptionsData);
            if (!imgs)
                return;
            redis.set(`${this.key}${chatId}:${id_str}`, "1", { EX: 3600 * 10 });
            (logger ?? Bot.logger)?.mark("优纪插件：B站动态执行推送");
            for (let i = 0; i < imgs.length; i++) {
                const image = imgs[i];
                await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
                await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 2000 + 1) + 2000)));
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        else {
            const dynamicMsg = await BiliQuery.formatTextDynamicData(upName, pushDynamicData, false, biliConfigData);
            redis.set(`${this.key}${chatId}:${id_str}`, "1", { EX: 3600 * 10 });
            if (dynamicMsg == "continue") {
                return "return";
            }
            if (biliConfigData.banWords.length > 0) {
                const banWords = new RegExp(biliConfigData.banWords.join("|"), "g");
                if (banWords.test(dynamicMsg.join(""))) {
                    return "return";
                }
            }
            await this.sendMessage(chatId, bot_id, chatType, dynamicMsg);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    buildRenderData(extentData, urlQrcodeData, boxGrid) {
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
        }
        else {
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
    async renderDynamicCard(uid, renderData, ScreenshotOptionsData) {
        const dynamicMsg = await Image.renderPage(uid, "MainPage", renderData, ScreenshotOptionsData);
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
            await (Bot[bot_id] ?? Bot)?.pickUser(String(chatId)).sendMsg(message)
                .catch((error) => {
                (logger ?? Bot.logger)?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
    }
    async randomDelay(min, max) {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
    }
}

export { BiliTask };
