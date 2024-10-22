import QRCode from 'qrcode';
import Config from '../../utils/config.js';
import { renderPage } from '../../utils/image.js';
import { BiliGetWebData } from './bilibili.get.web.data.js';
import { readSyncCookie, postGateway } from './bilibili.models.js';
import { BiliQuery } from './bilibili.query.js';

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
        const resp = await new BiliGetWebData().getBiliDynamicListDataByUid(uid);
        const resjson = await resp.data;
        let { cookie } = await readSyncCookie();
        if (resjson.code === 0) {
            return resjson;
        }
        else if (resjson.code === -352) {
            await postGateway(cookie);
            if (count < 3) {
                await this.randomDelay(2000, 8000);
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
        let biliConfigData = await Config.getUserConfig('bilibili', 'config');
        let biliPushData = await Config.getUserConfig('bilibili', 'push');
        let interval = biliConfigData?.interval || 7200;
        const uidMap = new Map();
        const dynamicList = {};
        await this.processBiliData(biliPushData, biliConfigData, uidMap, dynamicList);
        let now = Date.now() / 1000;
        await this.pushDynamicMessages(uidMap, dynamicList, now, interval, biliConfigData);
    }
    async processBiliData(biliPushData, biliConfigData, uidMap, dynamicList) {
        let getDataRandomDelay = biliConfigData?.getDataRandomDelay || 8000;
        const requestedDataOfUids = new Map();
        for (let chatType in biliPushData) {
            if (!uidMap.has(chatType)) {
                uidMap.set(chatType, new Map());
            }
            const chatTypeMap = uidMap.get(chatType);
            for (let chatId in biliPushData[chatType]) {
                const subUpsOfChat = Array.prototype.slice.call(biliPushData[chatType][chatId] || []);
                for (let subInfoOfup of subUpsOfChat) {
                    let resp;
                    if (requestedDataOfUids.has(subInfoOfup.uid)) {
                        resp = requestedDataOfUids.get(subInfoOfup.uid);
                        const dynamicData = resp.data?.items || [];
                        dynamicList[subInfoOfup.uid] = dynamicData;
                    }
                    else {
                        resp = await this.hendleEventDynamicData(subInfoOfup.uid);
                        if (resp) {
                            if (resp.code === 0) {
                                requestedDataOfUids.set(subInfoOfup.uid, resp);
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
                            logger.error(`获取 ${subInfoOfup.uid} 动态失败，无响应数据，本次任务终止，待下次任务自动重试`);
                            return;
                        }
                    }
                    const chatIds = Array.from(new Set([...Object((chatTypeMap.get(subInfoOfup.uid) && chatTypeMap.get(subInfoOfup.uid).chatIds) || []), chatId]));
                    const bot_id = subInfoOfup.bot_id || [];
                    const { name, type } = subInfoOfup;
                    chatTypeMap.set(subInfoOfup.uid, { chatIds, bot_id, upName: name, type });
                    await this.randomDelay(2000, getDataRandomDelay);
                }
            }
        }
        requestedDataOfUids.clear();
    }
    async pushDynamicMessages(uidMap, dynamicList, now, interval, biliConfigData) {
        for (let [chatType, chatTypeMap] of uidMap) {
            for (let [key, value] of chatTypeMap) {
                const tempDynamicList = dynamicList[key] || [];
                const willPushDynamicList = [];
                const printedList = new Set();
                for (let dynamicItem of tempDynamicList) {
                    let author = dynamicItem?.modules?.module_author || {};
                    if (!printedList.has(author?.mid)) {
                        logger.info(`正在检测B站动态 [ ${author?.name} : ${author?.mid} ]`);
                        printedList.add(author?.mid);
                    }
                    if (!author?.pub_ts)
                        continue;
                    if (Number(now - author.pub_ts) > interval) {
                        logger.debug(`超过间隔，跳过  [ ${author?.name} : ${author?.mid} ] ${author?.pub_time} 的动态`);
                        continue;
                    }
                    if (dynamicItem.type === 'DYNAMIC_TYPE_FORWARD' && !biliConfigData.pushTransmit)
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
                            await this.sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType);
                            await this.randomDelay(1000, 2000);
                        }
                    }
                }
            }
        }
    }
    async sendDynamic(chatId, bot_id, upName, pushDynamicData, biliConfigData, chatType) {
        const id_str = pushDynamicData.id_str;
        let sended, markKey;
        if (chatType === 'group') {
            markKey = this.groupKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        else if (chatType === 'private') {
            markKey = this.privateKey;
            sended = await redis.get(`${markKey}${chatId}:${id_str}`);
        }
        if (sended)
            return;
        if (!!biliConfigData.pushMsgMode) {
            const { data, uid } = await BiliQuery.formatDynamicData(pushDynamicData);
            const extentData = { ...data };
            const eval2 = eval;
            let banWords = eval2(`/${biliConfigData.banWords.join('|')}/g`);
            if (new RegExp(banWords).test(`${extentData?.title}${extentData?.content}`)) {
                return 'return';
            }
            let boxGrid = !!biliConfigData.boxGrid === false ? false : true;
            let isSplit = !!biliConfigData.isSplit === false ? false : true;
            let style = isSplit ? '' : `.unfold { max-height: ${biliConfigData?.noSplitHeight ?? 7500}px; }`;
            let splitHeight = biliConfigData?.splitHeight || 8000;
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
                return;
            redis.set(`${markKey}${chatId}:${id_str}`, '1', { EX: 3600 * 10 });
            (logger ?? Bot.logger)?.mark('优纪插件：B站动态执行推送');
            for (let i = 0; i < imgs.length; i++) {
                const image = imgs[i];
                await this.sendMessage(chatId, bot_id, chatType, segment.image(image));
                await this.randomDelay(1000, 2000);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        else {
            const dynamicMsg = await BiliQuery.formatTextDynamicData(upName, pushDynamicData, false, biliConfigData);
            redis.set(`${markKey}${chatId}:${id_str}`, '1', { EX: 3600 * 10 });
            if (dynamicMsg == 'continue') {
                return 'return';
            }
            if (biliConfigData.banWords.length > 0) {
                const banWords = new RegExp(biliConfigData.banWords.join('|'), 'g');
                if (banWords.test(dynamicMsg.join(''))) {
                    return 'return';
                }
            }
            await this.sendMessage(chatId, bot_id, chatType, dynamicMsg);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
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
    async renderDynamicCard(uid, renderData, ScreenshotOptionsData) {
        const dynamicMsg = await renderPage(uid, 'MainPage', renderData, ScreenshotOptionsData);
        if (dynamicMsg !== false) {
            return dynamicMsg.img;
        }
        else {
            return null;
        }
    }
    async sendMessage(chatId, bot_id, chatType, message) {
        if (chatType === 'group') {
            await (Bot[bot_id] ?? Bot)
                ?.pickGroup(String(chatId))
                .sendMsg(message)
                .catch((error) => {
                (logger ?? Bot.logger)?.error(`群组[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
        else if (chatType === 'private') {
            await (Bot[bot_id] ?? Bot)
                ?.pickFriend(String(chatId))
                .sendMsg(message)
                .catch((error) => {
                (logger ?? Bot.logger)?.error(`用户[${chatId}]推送失败：${JSON.stringify(error)}`);
            });
        }
    }
    async randomDelay(min, max) {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));
    }
}

export { BiliTask };
