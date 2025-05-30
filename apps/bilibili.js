import JSON from 'json5';
import lodash from 'lodash';
import moment from 'moment';
import { BiliQuery } from '../models/bilibili/bilibili.main.query.js';
import { BiliTask } from '../models/bilibili/bilibili.main.task.js';
import Config from '../utils/config.js';
import { BilibiliWebDataFetcher } from '../models/bilibili/bilibili.main.get.web.data.js';
import { readLoginCookie, applyLoginQRCode, pollLoginQRCode, saveLoginCookie, postGateway, exitBiliLogin, checkBiliLogin, readSavedCookieItems, saveLocalBiliCk, readSyncCookie, getNewTempCk, saveTempCk } from '../models/bilibili/bilibili.main.models.js';
import plugin from '../../../lib/plugins/plugin.js';

class YukiBili extends plugin {
    constructor() {
        super({
            name: 'yuki-plugin-bilibili',
            dsc: 'b站相关指令',
            event: 'message',
            priority: -50,
            rule: [
                {
                    reg: '^(#|/)(yuki|优纪)?执行(b站|B站|bili|bilibili|哔哩|哔哩哔哩)任务$',
                    fnc: 'newPushTask',
                    permission: 'master'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(订阅|添加|add|ADD)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$',
                    fnc: 'addDynamicSub'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$',
                    fnc: 'delDynamicSub'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(扫码|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$',
                    fnc: 'scanBiliLogin'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$',
                    fnc: 'delBiliLogin'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?我的(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$',
                    fnc: 'myBiliLoginInfo'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(绑定|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)本地(ck|CK|cookie|COOKIE)(:|：)?.*$',
                    fnc: 'addLocalBiliCookie'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)本地(ck|CK|cookie|COOKIE)$',
                    fnc: 'delLocalBiliCookie'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?我的(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(ck|CK|cookie|COOKIE)$',
                    fnc: 'myUsingBiliCookie'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?刷新(b站|B站|bili|bilibili|哔哩|哔哩哔哩)临时(ck|CK|cookie|COOKIE)$',
                    fnc: 'reflashTempCk'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)全部(推送|动态|订阅)列表$',
                    fnc: 'allSubDynamicPushList'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(推送|动态|订阅)列表$',
                    fnc: 'singelSubDynamicPushList'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主.*$',
                    fnc: 'getBilibiUserInfoByUid'
                },
                {
                    reg: '^(#|/)(yuki|优纪)?搜索(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主.*$',
                    fnc: 'searchBiliUserInfoByKeyword'
                },
                {
                    reg: '(b23\.tv\/([a-zA-Z0-9]+))|(www\.bilibili\.com\/video\/)?(av\d+|BV[a-zA-Z0-9]+)',
                    fnc: 'getVideoInfoByAid_BV'
                }
            ]
        });
        this.biliConfigData = Config.getConfigData('config', 'bilibili', 'config');
        this.biliPushData = Config.getConfigData('config', 'bilibili', 'push');
        /** 定时任务 */
        this.task = {
            cron: !!this.biliConfigData.pushStatus ? (this.biliConfigData.checkDynamicCD ? this.biliConfigData.checkDynamicCD : '*/23  * * * *') : '',
            name: 'yuki插件---B站动态推送定时任务',
            fnc: () => this.newPushTask(),
            log: !!this.biliConfigData.pushTaskLog
        };
    }
    biliConfigData;
    biliPushData;
    /** B站动态推送定时任务 */
    async newPushTask() {
        await new BiliTask(this.e).runTask();
    }
    /** 添加B站动态订阅 */
    async addDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply('未取得bot主人身份，无权限添加B站动态订阅');
        }
        else {
            // 从消息中提取UID
            const uid = this.e.msg
                .replace(/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g, '')
                .trim()
                .replace(/^(uid|UID)?(:|：)?/g, '');
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的B站up主的UID！`);
                return true;
            }
            // 获取或初始化推送数据
            let subData = this.biliPushData || { group: {}, private: {} };
            // 根据聊天类型初始化数据
            let chatType = this.e.isGroup ? 'group' : 'private';
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            // 初始化群组或私聊数据
            if (!subData[chatType][chatId]) {
                subData[chatType][chatId] = [];
            }
            // 检查该 uid 是否已存在
            const upData = subData[chatType][chatId].find(item => item.uid === uid);
            if (upData) {
                // 更新推送类型
                upData.type = BiliQuery.typeHandle(upData, this.e.msg, 'add');
                this.biliPushData = subData;
                await Config.saveConfig('config', 'bilibili', 'push', subData);
                this.e.reply(`修改b站推送动态类型成功~\n${upData.name}：${uid}`);
                return;
            }
            // 获取 Bilibili 动态信息
            const res = await new BilibiliWebDataFetcher(this.e).getBiliDynamicListDataByUid(uid);
            if (res?.statusText !== 'OK') {
                this.e.reply('出了点网络问题，等会再试试吧~');
                return false;
            }
            const { code, data } = res.data || {};
            if (code === -352) {
                this.e.reply(`遭遇风控，该uid的主页空间动态内容检查失败~\n请检查Cookie配置后再试~\n将跳过校验并保存订阅，请自行检查uid是否正确。`);
                logger.mark(`yuki-plugin addDynamicSub Failed：${JSON.stringify(res.data)}`);
            }
            const { has_more, items } = data || {};
            let infoName = '';
            if (code === 0 && has_more === false) {
                this.e.reply(`检测到该uid的主页空间动态内容为空，\n执行uid：${uid} 校验...`);
                const resp = await new BilibiliWebDataFetcher(this.e).getBilibiUserInfoByUid(uid);
                if (resp?.statusText !== 'OK') {
                    this.e.reply('出了点网络问题，发起uid校验失败，等会再试试吧~');
                    return false;
                }
                const { code, data } = resp.data || {};
                if (code === -400) {
                    this.e.reply('发起uid检验请求错误~\n将跳过校验并保存订阅，请自行检查uid是否正确。');
                }
                else if (code === -403) {
                    this.e.reply('可能是Cookie过期或api参数错误，\n访问权限不足，发起uid检验失败。\n将跳过校验并保存订阅，请自行检查uid是否正确。');
                }
                else if (code === -404) {
                    this.e.reply(`经过校验，该用户不存在，\n输入的uid： ${uid} 无效。订阅失败。`);
                    return false;
                }
                else {
                    infoName = data?.name;
                    this.e.reply(`昵称：${infoName} \nuid：${uid} 校验成功！`);
                }
            }
            let name = '';
            if (Array.isArray(items)) {
                if (items.length > 0) {
                    name = items[0].modules?.module_author?.name || uid;
                }
            }
            else if (infoName) {
                name = infoName;
            }
            else {
                name = uid;
            }
            // 添加新的推送数据
            subData[chatType][chatId].push({
                bot_id: this.e.self_id, // 使用 bot_id， 对应 e_self_id
                uid,
                name: name,
                type: BiliQuery.typeHandle({ uid, name }, this.e.msg, 'add')
            });
            // 保存更新后的数据
            this.biliPushData = subData;
            Config.saveConfig('config', 'bilibili', 'push', subData);
            this.e.reply(`添加b站推送成功~\n${name}：${uid}`);
        }
    }
    /** 删除B站动态订阅 */
    async delDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply('未取得bot主人身份，无权限删除B站动态订阅');
        }
        else {
            // 提取用户输入的UID
            const uid = this.e.msg
                .replace(/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g, '')
                .trim()
                .replace(/^(uid|UID)?(:|：)?/g, '');
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的B站up主的UID！`);
                return;
            }
            // 获取或初始化B站推送数据
            let subData = this.biliPushData || { group: {}, private: {} };
            // 根据聊天类型初始化数据
            let chatType = this.e.isGroup ? 'group' : 'private';
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            // 初始化群组或私聊数据
            if (!subData[chatType][chatId]) {
                subData[chatType][chatId] = [];
            }
            // 查找指定UID的订阅数据
            const upData = subData[chatType][chatId].find((item) => item.uid == uid);
            if (!upData) {
                this.e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
                return;
            }
            // 处理订阅类型
            const newType = BiliQuery.typeHandle(upData, this.e.msg, 'del');
            let isDel = false;
            if (newType.length) {
                // 更新订阅类型
                subData[chatType][chatId] = subData[chatType][chatId].map(item => {
                    if (item.uid == uid) {
                        item.type = newType;
                    }
                    return item;
                });
            }
            else {
                // 删除订阅
                isDel = true;
                subData[chatType][chatId] = subData[chatType][chatId].filter(item => item.uid !== uid);
            }
            // 保存更新后的数据
            this.biliPushData = subData;
            Config.saveConfig('config', 'bilibili', 'push', subData);
            // 回复用户操作结果
            this.e.reply(`${isDel ? '删除' : '修改'}b站推送成功~\n${uid}`);
        }
    }
    /** 扫码登录B站 */
    async scanBiliLogin() {
        if (!this.e.isMaster) {
            this.e.reply('未取得bot主人身份，无权限配置B站登录ck');
        }
        else {
            const LoginCk = await readLoginCookie();
            if (LoginCk) {
                this.e.reply(`当前已有B站登录ck，请勿重复扫码！\n如需更换，请先删除当前登录ck：\n#yuki删除B站登录`);
            }
            else {
                try {
                    const token = await applyLoginQRCode(this.e);
                    if (token) {
                        let biliLoginCk = await pollLoginQRCode(this.e, token);
                        if (biliLoginCk) {
                            if (lodash.trim(biliLoginCk).length != 0) {
                                await saveLoginCookie(this.e, biliLoginCk);
                                this.e.reply(`get bilibili LoginCk：成功！`);
                                const result = await postGateway(biliLoginCk); //激活ck
                                const { code, data } = await result.data; // 解析校验结果
                                switch (code) {
                                    case 0:
                                        global?.logger?.mark(`优纪插件：获取biliLoginCK，Gateway校验成功：${JSON.stringify(data)}`);
                                        break;
                                    default:
                                        global?.logger?.mark(`优纪插件：获取biliLoginCK，Gateway校验失败：${JSON.stringify(data)}`);
                                        break;
                                }
                            }
                            else {
                                this.e.reply(`get bilibili LoginCk：失败X﹏X`);
                            }
                        }
                    }
                }
                catch (Error) {
                    global?.logger?.info(`yuki-plugin Login bilibili Failed：${Error}`);
                }
            }
        }
    }
    /** 删除登陆的B站ck */
    async delBiliLogin() {
        if (this.e.isMaster) {
            await exitBiliLogin(this.e);
            await redis.set('Yz:yuki:bili:loginCookie', '', { EX: 3600 * 24 * 180 });
            this.e.reply(`扫码登陆的B站cookie已删除~`);
        }
        else {
            this.e.reply('未取得bot主人身份，无权限删除B站登录ck');
        }
    }
    /**验证B站登录 */
    async myBiliLoginInfo() {
        if (this.e.isMaster) {
            await checkBiliLogin(this.e);
        }
        else {
            this.e.reply('未取得bot主人身份，无权限查看B站登录状态');
        }
    }
    /** 手动绑定本地获取的B站cookie */
    async addLocalBiliCookie() {
        if (this.e.isMaster) {
            if (this.e.isPrivate) {
                await this.reply('请注意账号安全，请手动撤回发送的cookie，并私聊进行添加绑定！');
            }
            else {
                let localBiliCookie = this.e.msg
                    .replace(/^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(ck|CK|cookie|COOKIE)(:|：)?/g, '')
                    .trim();
                let param = {};
                localBiliCookie.split(';').forEach(v => {
                    // 处理分割特殊cookie_token
                    let tmp = lodash.trim(v).replace('=', '$').split('$');
                    param[tmp[0]] = tmp[1];
                });
                if (!param.buvid3 || !param._uuid || !param.buvid4 || !param.DedeUserID) {
                    await this.e.reply('发送的cookie字段缺失\n请添加完整cookie\n获取方法查看仓库主页。');
                    const missingCookies = [];
                    if (!param.buvid3 || param.buvid3.length === 0) {
                        missingCookies.push('buvid3');
                    }
                    if (!param.buvid4 || param.buvid4.length === 0) {
                        missingCookies.push('buvid4');
                    }
                    if (!param._uuid || param._uuid.length === 0) {
                        missingCookies.push('_uuid');
                    }
                    if (!param.DedeUserID || param.DedeUserID.length === 0) {
                        missingCookies.push('DedeUserID');
                    }
                    if (missingCookies.length > 0) {
                        await this.e.reply(`当前缺失字段：\n${missingCookies.join('\n')}`);
                    }
                    return;
                }
                //筛选ck
                localBiliCookie = await readSavedCookieItems(localBiliCookie, ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid', 'buvid_fp', 'sid'], false);
                await saveLocalBiliCk(localBiliCookie);
                logger.mark(`${this.e.logFnc} 保存B站cookie成功 [UID:${param.DedeUserID}]`);
                let uidMsg = [`好耶~绑定B站cookie成功：\n${param.DedeUserID}`];
                await this.e.reply(uidMsg);
                const result = await postGateway(localBiliCookie); //激活ck
                const { code, data } = await result.data; // 解析校验结果
                switch (code) {
                    case 0:
                        (logger ?? Bot.logger)?.mark(`优纪插件：绑定localCK，Gateway校验成功：${JSON.stringify(data)}`);
                        break;
                    default:
                        (logger ?? Bot.logger)?.mark(`优纪插件：绑定localCK，Gateway校验失败：${JSON.stringify(data)}`);
                        break;
                }
            }
        }
        else {
            this.e.reply('未取得bot主人身份，无权限配置B站登录ck');
        }
    }
    /** 删除绑定的本地B站ck */
    async delLocalBiliCookie() {
        if (this.e.isMaster) {
            await saveLocalBiliCk('');
            await this.e.reply(`手动绑定的B站ck已删除~`);
        }
        else {
            this.e.reply('未取得bot主人身份，无权限删除B站登录ck');
        }
    }
    /** 当前正在使用的B站ck */
    async myUsingBiliCookie() {
        if (this.e.isGroup) {
            await this.reply('注意账号安全，请私聊查看叭');
        }
        else {
            if (this.e.isMaster) {
                let { cookie, mark } = await readSyncCookie();
                if (mark === 'localCk') {
                    this.e.reply(`当前使用本地获取的B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark === 'loginCk') {
                    this.e.reply(`当前使用扫码登录的B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark === 'tempCk') {
                    this.e.reply(`当前使用自动获取的临时B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark == 'ckIsEmpty') {
                    this.e.reply(`当前无可使用的B站cookie。`);
                }
            }
            else {
                this.e.reply('未取得bot主人身份，无权限查看当前使用的B站cookie');
            }
        }
    }
    /** 删除并刷新redis缓存的临时B站ck */
    async reflashTempCk() {
        try {
            const newTempCk = await getNewTempCk();
            if (newTempCk) {
                await saveTempCk(newTempCk);
                const result = await postGateway(newTempCk);
                const data = await result.data; // 解析校验结果
                if (data?.code !== 0) {
                    logger?.error(`优纪插件：tempCK，Gateway校验失败：${JSON.stringify(data)}`);
                }
                else if (data?.code === 0) {
                    logger?.mark(`优纪插件：tempCK，Gateway校验成功：${JSON.stringify(data)}`);
                }
                this.e.reply(`~yuki-plugin:\n临时b站ck刷新成功~❤~\n接下来如果获取动态失败，请重启bot(手动或发送指令 #重启)刷新状态~\n如果重启续仍不可用，请考虑 #优纪添加b站登录 吧~`);
            }
            else {
                this.e.reply(`~yuki-plugin:\n临时b站ck刷新失败X﹏X\n请重启bot(手动或发送指令 #重启)后重试`);
            }
        }
        catch (error) {
            this.e.reply(`~yuki-plugin:\n临时b站ck刷新失败X﹏X\n请重启bot(手动或发送指令 #重启)后重试`);
            (logger ?? Bot.logger)?.mark(`优纪插件：B站临时ck刷新error：${error}`);
        }
    }
    /** 订阅的全部b站推送列表 */
    async allSubDynamicPushList() {
        if (!this.e.isMaster) {
            this.e.reply('未取得bot主人身份，无权限查看Bot的全部B站订阅列表');
        }
        else {
            let subData = this.biliPushData || { group: {}, private: {} };
            // 如果聊天ID没有订阅数据，则删除该聊天ID
            for (let chatType in subData) {
                if (subData.hasOwnProperty(chatType)) {
                    subData[chatType] = Object.keys(subData[chatType]).reduce((nonEmptyData, chatId) => {
                        if (subData[chatType][chatId].length > 0) {
                            nonEmptyData[chatId] = subData[chatType][chatId];
                        }
                        return nonEmptyData;
                    }, {});
                }
            }
            const messages = [];
            const typeMap = {
                DYNAMIC_TYPE_AV: '视频',
                DYNAMIC_TYPE_WORD: '图文',
                DYNAMIC_TYPE_DRAW: '图文',
                DYNAMIC_TYPE_ARTICLE: '文章',
                DYNAMIC_TYPE_FORWARD: '转发',
                DYNAMIC_TYPE_LIVE_RCMD: '直播'
            };
            // 处理群组订阅
            if (subData.group && Object.keys(subData.group).length > 0) {
                messages.push('\n>>>>>>群组B站订阅<<<<<<');
                Object.keys(subData.group).forEach(groupId => {
                    messages.push(`\n<群组${groupId}>：`);
                    subData.group[groupId].forEach((item) => {
                        const types = new Set();
                        if (item.type && item.type.length) {
                            item.type.forEach((typeItem) => {
                                if (typeMap[typeItem]) {
                                    types.add(typeMap[typeItem]);
                                }
                            });
                        }
                        messages.push(`${item.uid}：${item.name}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
                    });
                });
            }
            else {
                messages.push('\n>>>>>>群组B站订阅<<<<<<\n当前没有任何群组订阅数据~');
            }
            // 处理私聊订阅
            if (subData.private && Object.keys(subData.private).length > 0) {
                messages.push('\n>>>>>>私聊B站订阅<<<<<<');
                Object.keys(subData.private).forEach(userId => {
                    messages.push(`\n<用户${userId}>：`);
                    subData.private[userId].forEach((item) => {
                        const types = new Set();
                        if (item.type && item.type.length) {
                            item.type.forEach((typeItem) => {
                                if (typeMap[typeItem]) {
                                    types.add(typeMap[typeItem]);
                                }
                            });
                        }
                        messages.push(`${item.uid}：${item.name}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
                    });
                });
            }
            else {
                messages.push('\n>>>>>>私聊B站订阅<<<<<<\n当前没有任何私聊订阅数据~');
            }
            this.e.reply(`推送列表如下：\n${messages.join('\n')}`);
        }
    }
    /** 单独群聊或私聊的订阅的b站推送列表 */
    async singelSubDynamicPushList() {
        let subData = this.biliPushData || { group: {}, private: {} };
        // 如果聊天ID没有订阅数据，则删除该聊天ID
        for (let chatType in subData) {
            if (subData.hasOwnProperty(chatType)) {
                subData[chatType] = Object.keys(subData[chatType]).reduce((nonEmptyData, chatId) => {
                    if (subData[chatType][chatId].length > 0) {
                        nonEmptyData[chatId] = subData[chatType][chatId];
                    }
                    return nonEmptyData;
                }, {});
            }
        }
        const messages = [];
        const typeMap = {
            DYNAMIC_TYPE_AV: '视频',
            DYNAMIC_TYPE_WORD: '图文',
            DYNAMIC_TYPE_DRAW: '图文',
            DYNAMIC_TYPE_ARTICLE: '文章',
            DYNAMIC_TYPE_FORWARD: '转发',
            DYNAMIC_TYPE_LIVE_RCMD: '直播'
        };
        // 根据聊天类型初始化数据
        let chatType = this.e.isGroup ? 'group' : 'private';
        let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
        if (!subData[chatType][chatId]) {
            subData[chatType][chatId] = [];
        }
        subData[chatType][chatId].forEach((item) => {
            const types = new Set();
            if (item.type && item.type.length) {
                item.type.forEach((typeItem) => {
                    if (typeMap[typeItem]) {
                        types.add(typeMap[typeItem]);
                    }
                });
            }
            messages.push(`${item.uid}：${item.name}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
        });
        this.e.reply(`推送列表如下：\n${messages.join('\n')}`);
    }
    /**通过uid获取up主信息 */
    async getBilibiUserInfoByUid() {
        let uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主/g, '').trim();
        const res = await new BilibiliWebDataFetcher(this.e).getBilibiUserInfoByUid(uid);
        if (res?.statusText !== 'OK') {
            this.e.reply('诶嘿，出了点网络问题，等会再试试吧~');
            return;
        }
        const { code, data } = res.data || {};
        if (code === -400) {
            this.e.reply('获取请求错误~');
            return;
        }
        else if (code === -403) {
            this.e.reply('可能是Cookie过期或api参数错误，\n访问权限不足，获取失败。');
            return;
        }
        else if (code === -404) {
            this.e.reply('用户不存在，输入的uid无效。');
            return;
        }
        const message = [`--------------------`, `\n昵称：${data?.name}`, `\n性别：${data?.sex}`, `\n等级：${data?.level}`, `\n--------------------`];
        if (data.live_room) {
            message.push(`\n>>>>>直播间信息<<<<<`, `\n标题：${data?.live_room?.title}`, `\n房间：${data?.live_room?.roomid}`, `\n状态：${data?.live_room?.liveStatus ? '直播中' : '未开播'}`, `\n观看人数：${data?.live_room?.watched_show?.num}`);
            this.e.reply(`直播链接：${data?.live_room?.url}`);
        }
        this.e.reply(message);
    }
    /** 根据名称搜索up的uid*/
    async searchBiliUserInfoByKeyword() {
        let keyword = this.e.msg.replace(/^(#|\/)(yuki|优纪)?搜索(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主/g, '').trim();
        const res = await new BilibiliWebDataFetcher(this.e).searchBiliUserInfoByKeyword(keyword);
        if (res?.statusText !== 'OK') {
            this.e.reply('诶嘿，出了点网络问题，等会再试试吧~');
            return;
        }
        const { code, data } = (await res.data) || {};
        if (code === -400) {
            this.e.reply('搜索请求错误~');
            return;
        }
        else if (code === -412) {
            this.e.reply('未配置可用Cookie，请求被拦截，请配置Cookie后再试吧~');
            return;
        }
        if (!data.result) {
            this.e.reply('哦豁~没有搜索到该关键词相关的up主信息，请换个关键词试试吧~');
            return;
        }
        if (!Array.isArray(data.result) || !data.result.every(item => typeof item === 'object' && 'uname' in item && 'mid' in item && 'fans' in item)) {
            this.e.reply('哦豁~数据格式有误，请检查后重试！');
            return;
        }
        const messages = [];
        for (let index = 0; index < Math.min(data.result.length, 5); index++) {
            const item = data.result[index];
            messages.push(`${item.uname}\nUID：${item.mid}\n粉丝数：${item.fans}${index < 4 ? '\n' : ''}`);
        }
        this.e.reply(messages.join('\n'));
    }
    /** 根据aid或bvid获解析频信息*/
    async getVideoInfoByAid_BV() {
        let parseVideoLink = !!this.biliConfigData?.parseVideoLink === false ? false : true;
        if (parseVideoLink === false) {
            logger?.info(`优纪B站视频链接解析配置文件已设置关闭，解析终止。`);
            return false;
        }
        const videoIDMatch = this.e.msg.match(/(b23\.tv\/([a-zA-Z0-9]+))|(www\.bilibili\.com\/video\/)?(av\d+|BV[a-zA-Z0-9]+)/);
        let videoID;
        if (videoIDMatch) {
            if (videoIDMatch[2]) {
                // 匹配 b23.tv/ 后面的部分
                const bvidStr = await new BilibiliWebDataFetcher(this.e).getBVIDByShortUrl(videoIDMatch[2]);
                videoID = { bvid: bvidStr };
            }
            else if (videoIDMatch[4].startsWith('av')) {
                // 匹配 av 开头的部分
                const aid = videoIDMatch[4].replace(/^av/, '');
                videoID = { aid: Number(aid) };
            }
            else if (videoIDMatch[4].startsWith('BV')) {
                // 匹配 BV 开头的部分
                videoID = { bvid: videoIDMatch[4] };
            }
        }
        this.e.reply('优纪酱解析中，请稍后~');
        const res = await new BilibiliWebDataFetcher(this.e).getBiliVideoInfoByAid_BV(videoID);
        if (res?.statusText !== 'OK') {
            this.e.reply('诶嘿，出了点网络问题，等会再试试吧~');
            return;
        }
        const { code, data } = (await res.data) || {};
        function formatNumber(num) {
            if (num >= 10000) {
                return `${(num / 10000).toFixed(1)}万`;
            }
            return num.toString();
        }
        function formatDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            const mm = minutes.toString().padStart(2, '0');
            const ss = secs.toString().padStart(2, '0');
            return `${hours}:${mm}:${ss}`;
        }
        if (code === -400) {
            this.e.reply('视频解析请求错误~');
            return;
        }
        else if (code === -403) {
            this.e.reply(`权限不足，视频解析失败。`);
            return;
        }
        else if (code === -404) {
            this.e.reply('解析的视频不存在。');
            return;
        }
        else if (code === 62002) {
            this.e.reply('解析的视频稿件不可见。');
            return;
        }
        else if (code === 62004) {
            this.e.reply('解析的视频稿件审核中。');
            return;
        }
        else if (code === 62012) {
            this.e.reply('解析的视频稿件仅up主可见。');
            return;
        }
        else if (code === 0) {
            const message = [
                `${data?.title}\n`,
                segment.image(data.pic),
                `\nbvid：${data?.bvid}`,
                `\n--------------------`,
                `\n分区：${data?.tname_v2} (${data?.tname})`,
                `\n投稿：${moment(data?.ctime * 1000).format('YYYY年MM月DD日 HH:mm:ss')}`,
                `\n发布：${moment(data?.pubdate * 1000).format('YYYY年MM月DD日 HH:mm:ss')}`,
                `\n时长：${formatDuration(data?.duration)}`,
                `\n创作：${data?.copyright === 1 ? '原创' : '转载'}`,
                `\n--------------------`,
                `\nUP主：${data?.owner?.name}`,
                `\nUID：${data?.owner?.mid}`,
                //`\n作者头像：${segment.image(data?.owner?.face)}`,
                `\n--------------------`,
                `\n视频简介：`,
                `\n${data?.desc}`,
                `\n--------------------`,
                `\n${formatNumber(data?.stat?.view)}播放 • ${formatNumber(data?.stat?.danmaku)}弹幕 • ${formatNumber(data?.stat?.reply)}评论 `,
                `\n${formatNumber(data?.stat?.like)}点赞 • ${formatNumber(data?.stat?.coin)}投币 • ${formatNumber(data?.stat?.favorite)}收藏`,
                `\n${formatNumber(data?.stat?.share)}分享`,
                `\n--------------------`,
                `\n链接：b23.tv/${data?.bvid}`
            ];
            this.e.reply(message);
        }
    }
}

export { YukiBili as default };
