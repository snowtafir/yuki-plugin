import JSON from 'json5';
import lodash from 'lodash';
import { BiliQuery } from '../models/bilibili/bilibili.query.js';
import { BiliTask } from '../models/bilibili/bilibili.task.js';
import Config from '../utils/config.js';
import { BiliGetWebData } from '../models/bilibili/bilibili.get.web.data.js';
import { applyLoginQRCode, pollLoginQRCode, saveLoginCookie, postGateway, exitBiliLogin, checkBiliLogin, readSavedCookieItems, saveLocalBiliCk, readSyncCookie, getNewTempCk, readTempCk } from '../models/bilibili/bilibili.models.js';
import plugin from '../../../lib/plugins/plugin.js';

class YukiBili extends plugin {
    constructor() {
        super({
            name: "yuki-plugin-bilibili",
            dsc: "b站相关指令",
            event: "message",
            priority: -50,
            rule: [
                {
                    reg: "^(#|\/)(yuki|优纪)?执行(b站|B站|bili|bilibili|哔哩|哔哩哔哩)任务$",
                    fnc: "newPushTask",
                    permission: "master",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$",
                    fnc: "addDynamicSub",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$",
                    fnc: "delDynamicSub",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(扫码|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$",
                    fnc: "scanBiliLogin",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$",
                    fnc: "delBiliLogin",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?我的(b站|B站|bili|bilibili|哔哩|哔哩哔哩)登录$",
                    fnc: "myBiliLoginInfo",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)本地(ck|CK|cookie|COOKIE)(:|：)?.*$",
                    fnc: "addLocalBiliCookie",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)本地(ck|CK|cookie|COOKIE)$",
                    fnc: "delLocalBiliCookie",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?我的(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(ck|CK|cookie|COOKIE)$",
                    fnc: "myUsingBiliCookie",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?刷新(b站|B站|bili|bilibili|哔哩|哔哩哔哩)临时(ck|CK|cookie|COOKIE)$",
                    fnc: "reflashTempCk",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)全部(推送|动态|订阅)列表$",
                    fnc: "allSubDynamicPushList",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(推送|动态|订阅)列表$",
                    fnc: "singelSubDynamicPushList",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主.*$",
                    fnc: "getBilibiUserInfoByUid",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?搜索(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主.*$",
                    fnc: "searchBiliUserInfoByKeyword",
                },
            ]
        });
        this.biliConfigData = Config.getConfigData("config", "bilibili", "config");
        this.biliPushData = Config.getConfigData("config", "bilibili", "push");
        this.task = {
            cron: !!this.biliConfigData.pushStatus ? this.biliConfigData.pushTime : "",
            name: "yuki插件---B站动态推送定时任务",
            fnc: () => this.newPushTask(),
            log: !!this.biliConfigData.pushTaskLog,
        };
    }
    biliConfigData;
    biliPushData;
    async newPushTask() {
        await new BiliTask(this.e).runTask();
    }
    async addDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限添加B站动态订阅");
        }
        else {
            const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g, "").trim();
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的B站up主的UID！`);
                return true;
            }
            let subData = this.biliPushData || { group: {}, private: {} };
            let chatType = this.e.isGroup ? "group" : "private";
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            if (!subData[chatType][chatId]) {
                subData[chatType][chatId] = [];
            }
            const upData = subData[chatType][chatId].find((item) => item.uid === uid);
            if (upData) {
                upData.type = BiliQuery.typeHandle(upData, this.e.msg, "add");
                this.biliPushData = subData;
                await Config.saveConfig("config", "bilibili", "push", subData);
                this.e.reply(`修改b站推送动态类型成功~\n${upData.name}：${uid}`);
                return;
            }
            const res = await new BiliGetWebData(this.e).getBiliDynamicListDataByUid(uid);
            if (res.statusText !== "OK") {
                this.e.reply("出了点网络问题，等会再试试吧~");
                return false;
            }
            const { code, data } = res.data || {};
            if (code === -352) {
                this.e.reply(`遭遇风控，订阅校验失败~\n请检查Cookie配置后再试~`);
                logger.mark(`yuki-plugin addDynamicSub Failed：${JSON.stringify(res.data)}`);
                return true;
            }
            const { has_more, items } = data || {};
            if ((code === 0) && (has_more === false)) {
                this.e.reply(`订阅校验失败~\nup主uid：${uid} 无效，请核对uid后再试~`);
                return;
            }
            let name = items.length > 0 ? (items[0].modules.module_author?.name || uid) : uid;
            subData[chatType][chatId].push({
                bot_id: this.e.self_id,
                uid,
                name: name,
                type: BiliQuery.typeHandle({ uid, name }, this.e.msg, "add"),
            });
            this.biliPushData = subData;
            Config.saveConfig("config", "bilibili", "push", subData);
            this.e.reply(`添加b站推送成功~\n${name}：${uid}`);
        }
    }
    async delDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限删除B站动态订阅");
        }
        else {
            const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g, "").trim();
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的B站up主的UID！`);
                return;
            }
            let subData = this.biliPushData || { group: {}, private: {} };
            let chatType = this.e.isGroup ? "group" : "private";
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            if (!subData[chatType][chatId]) {
                subData[chatType][chatId] = [];
            }
            const upData = subData[chatType][chatId].find((item) => item.uid == uid);
            if (!upData) {
                this.e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
                return;
            }
            const newType = BiliQuery.typeHandle(upData, this.e.msg, "del");
            let isDel = false;
            if (newType.length) {
                subData[chatType][chatId] = subData[chatType][chatId].map((item) => {
                    if (item.uid == uid) {
                        item.type = newType;
                    }
                    return item;
                });
            }
            else {
                isDel = true;
                subData[chatType][chatId] = subData[chatType][chatId].filter((item) => item.uid !== uid);
            }
            this.biliPushData = subData;
            Config.saveConfig("config", "bilibili", "push", subData);
            this.e.reply(`${isDel ? "删除" : "修改"}b站推送成功~\n${uid}`);
        }
    }
    async scanBiliLogin() {
        if (this.e.isMaster) {
            try {
                const token = await applyLoginQRCode(this.e);
                let biliLoginCk = await pollLoginQRCode(this.e, token);
                if (lodash.trim(biliLoginCk).length != 0) {
                    await saveLoginCookie(this.e, biliLoginCk);
                    this.e.reply(`get bilibili LoginCk：成功！`);
                    const result = await postGateway(biliLoginCk);
                    const { code, data } = await result.data;
                    switch (code) {
                        case 0:
                            (logger ?? Bot.logger)?.mark(`优纪插件：获取biliLoginCK，Gateway校验成功：${JSON.stringify(data)}`);
                            break;
                        default:
                            (logger ?? Bot.logger)?.mark(`优纪插件：获取biliLoginCK，Gateway校验失败：${JSON.stringify(data)}`);
                            break;
                    }
                }
                else {
                    this.e.reply(`get bilibili LoginCk：失败X﹏X`);
                }
            }
            catch (Error) {
                (logger ?? Bot.logger)?.info(`yuki-plugin Login bilibili Failed：${Error}`);
            }
        }
        else {
            this.e.reply("未取得bot主人身份，无权限配置B站登录ck");
        }
    }
    async delBiliLogin() {
        if (this.e.isMaster) {
            await exitBiliLogin(this.e);
            await redis.set("Yz:yuki:bili:loginCookie", "", { EX: 3600 * 24 * 180 });
            this.e.reply(`登陆的B站ck并已删除~`);
        }
        else {
            this.e.reply("未取得bot主人身份，无权限删除B站登录ck");
        }
    }
    async myBiliLoginInfo() {
        if (this.e.isMaster) {
            await checkBiliLogin(this.e);
        }
        else {
            this.e.reply("未取得bot主人身份，无权限查看B站登录状态");
        }
    }
    async addLocalBiliCookie() {
        if (this.e.isMaster) {
            if (this.e.isPrivate) {
                await this.reply('请注意账号安全，请手动撤回发送的cookie，并私聊进行添加绑定！');
            }
            else {
                let localBiliCookie = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(ck|CK|cookie|COOKIE)(:|：)?/g, "").trim();
                let param = {};
                localBiliCookie.split(';').forEach((v) => {
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
                localBiliCookie = await readSavedCookieItems(localBiliCookie, ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid'], false);
                await saveLocalBiliCk(localBiliCookie);
                logger.mark(`${this.e.logFnc} 保存B站cookie成功 [UID:${param.DedeUserID}]`);
                let uidMsg = [`好耶~绑定B站cookie成功：\n${param.DedeUserID}`];
                await this.e.reply(uidMsg);
                const result = await postGateway(localBiliCookie);
                const { code, data } = await result.data;
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
            this.e.reply("未取得bot主人身份，无权限配置B站登录ck");
        }
    }
    async delLocalBiliCookie() {
        if (this.e.isMaster) {
            await saveLocalBiliCk("");
            await this.e.reply(`手动绑定的B站ck已删除~`);
        }
        else {
            this.e.reply("未取得bot主人身份，无权限删除B站登录ck");
        }
    }
    async myUsingBiliCookie() {
        if (this.e.isGroup) {
            await this.reply('注意账号安全，请私聊查看叭');
        }
        else {
            if (this.e.isMaster) {
                let { cookie, mark } = await readSyncCookie();
                if (mark === "localCk") {
                    this.e.reply(`当前使用本地获取的B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark === "loginCk") {
                    this.e.reply(`当前使用扫码登录的B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark === "tempCk") {
                    this.e.reply(`当前使用自动获取的临时B站cookie：`);
                    this.e.reply(`${cookie}`);
                }
                else if (mark == 'ckIsEmpty') {
                    this.e.reply(`当前无可使用的B站cookie。`);
                }
            }
            else {
                this.e.reply("未取得bot主人身份，无权限查看当前使用的B站cookie");
            }
        }
    }
    async reflashTempCk() {
        try {
            await getNewTempCk();
            let newTempCk = await readTempCk();
            if ((newTempCk !== null) && (newTempCk !== undefined) && (newTempCk.length !== 0) && (newTempCk !== '')) {
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
    async allSubDynamicPushList() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限查看Bot的全部B站订阅列表");
        }
        else {
            let subData = this.biliPushData || { group: {}, private: {} };
            const messages = [];
            const typeMap = {
                DYNAMIC_TYPE_AV: "视频",
                DYNAMIC_TYPE_WORD: "图文",
                DYNAMIC_TYPE_DRAW: "图文",
                DYNAMIC_TYPE_ARTICLE: "文章",
                DYNAMIC_TYPE_FORWARD: "转发",
                DYNAMIC_TYPE_LIVE_RCMD: "直播",
            };
            if (subData.group && Object.keys(subData.group).length > 0) {
                messages.push("------群组B站订阅------");
                Object.keys(subData.group).forEach((groupId) => {
                    messages.push(`群组ID：${groupId}：`);
                    subData.group[groupId].forEach((item) => {
                        const types = new Set();
                        if (item.type && item.type.length) {
                            item.type.forEach((typeItem) => {
                                if (typeMap[typeItem]) {
                                    types.add(typeMap[typeItem]);
                                }
                            });
                        }
                        messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join("、")}]` : " [全部动态]"}`);
                    });
                });
            }
            if (subData.private && Object.keys(subData.private).length > 0) {
                messages.push("------私聊B站订阅------");
                Object.keys(subData.private).forEach((userId) => {
                    messages.push(`用户ID：${userId}：`);
                    subData.private[userId].forEach((item) => {
                        const types = new Set();
                        if (item.type && item.type.length) {
                            item.type.forEach((typeItem) => {
                                if (typeMap[typeItem]) {
                                    types.add(typeMap[typeItem]);
                                }
                            });
                        }
                        messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join("、")}]` : " [全部动态]"}`);
                    });
                });
            }
            this.e.reply(`推送列表如下：\n${messages.join("\n")}`);
        }
    }
    async singelSubDynamicPushList() {
        let subData = this.biliPushData || { group: {}, private: {} };
        const messages = [];
        const typeMap = {
            DYNAMIC_TYPE_AV: "视频",
            DYNAMIC_TYPE_WORD: "图文",
            DYNAMIC_TYPE_DRAW: "图文",
            DYNAMIC_TYPE_ARTICLE: "文章",
            DYNAMIC_TYPE_FORWARD: "转发",
            DYNAMIC_TYPE_LIVE_RCMD: "直播",
        };
        let chatType = this.e.isGroup ? "group" : "private";
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
            messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join("、")}]` : " [全部动态]"}`);
        });
        this.e.reply(`推送列表如下：\n${messages.join("\n")}`);
    }
    async getBilibiUserInfoByUid() {
        let uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主/g, "").trim();
        const res = await new BiliGetWebData(this.e).getBilibiUserInfoByUid(uid);
        if (res.statusText !== 'OK') {
            this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
            return;
        }
        const { code, data } = res.data || {};
        if (code === -400) {
            this.e.reply("获取请求错误~");
            return;
        }
        else if (code === -403) {
            this.e.reply("可能是Cookie过期或api参数错误，\n访问权限不足，获取失败。");
            return;
        }
        else if (code === -404) {
            this.e.reply("用户不存在，输入的uid无效。");
            return;
        }
        const message = [
            `昵称：${data?.name}`,
            `\n性别：${data?.sex}`,
            `\n等级：${data?.level}`,
        ];
        if (data.live_room) {
            message.push(`***********\n---直播信息---`, `\n直播标题：${data?.live_room?.title}`, `\n直播房间：${data?.live_room?.roomid}`, `\n直播状态：${data?.live_room?.liveStatus ? "直播中" : "未开播"}`, `\n观看人数：${data?.live_room?.watched_show?.num}人`);
            this.e.reply(`直播链接：${data?.live_room?.url}`);
        }
        this.e.reply(message);
    }
    async searchBiliUserInfoByKeyword() {
        let keyword = this.e.msg.replace(/^(#|\/)(yuki|优纪)?搜索(b站|B站|bili|bilibili|哔哩|哔哩哔哩)(up|UP)主/g, "").trim();
        const res = await new BiliGetWebData(this.e).searchBiliUserInfoByKeyword(keyword);
        if (res.statusText !== 'OK') {
            this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
            return;
        }
        const { code, data } = await res.data || {};
        if (code === -400) {
            this.e.reply("搜索请求错误~");
            return;
        }
        else if (code === -412) {
            this.e.reply("未配置可用Cookie，请求被拦截，请配置Cookie后再试吧~");
            return;
        }
        if (!data.result) {
            this.e.reply("哦豁~没有搜索到该关键词相关的up主信息，请换个关键词试试吧~");
            return;
        }
        if (!Array.isArray(data.result) || !data.result.every(item => typeof item === 'object' && 'uname' in item && 'mid' in item && 'fans' in item)) {
            this.e.reply("哦豁~数据格式有误，请检查后重试！");
            return;
        }
        const messages = [];
        for (let index = 0; index < Math.min((data.result).length, 5); index++) {
            const item = data.result[index];
            messages.push(`${item.uname}\nUID：${item.mid}\n粉丝数：${item.fans}${index < 4 ? "\n" : ""}`);
        }
        this.e.reply(messages.join("\n"));
    }
}

export { YukiBili as default };
