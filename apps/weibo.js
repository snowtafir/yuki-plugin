import { WeiboQuery } from '../models/weibo/weibo.query.js';
import { WeiboTask } from '../models/weibo/weibo.task.js';
import Config from '../utils/config.js';
import { WeiboGetWebData } from '../models/weibo/weibo.get.web.data.js';
import plugin from '../../../lib/plugins/plugin.js';

class YukiWeibo extends plugin {
    constructor() {
        super({
            name: "yuki-plugin-weibo",
            dsc: "微博相关指令",
            event: "message",
            priority: 550,
            rule: [
                {
                    reg: "^(#|\/)(yuki|优纪)?执行(微博|weibo|WEIBO)任务$",
                    fnc: "newPushTask",
                    permission: "master",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$",
                    fnc: "addDynamicSub",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$",
                    fnc: "delDynamicSub",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)全部(推送|动态|订阅)列表$",
                    fnc: "allSubDynamicPushList",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(推送|动态|订阅)列表$",
                    fnc: "singelSubDynamicPushList",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主.*$",
                    fnc: "getWeiboUserInfoByUid",
                },
                {
                    reg: "^(#|\/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主.*$",
                    fnc: "searchWeiboUserInfoByKeyword",
                },
            ]
        });
        this.weiboConfigData = Config.getConfigData("config", "weibo", "config");
        this.weiboPushData = Config.getConfigData("config", "weibo", "push");
        this.task = {
            cron: !!this.weiboConfigData.pushStatus ? this.weiboConfigData.pushTime : "",
            name: "yuki插件---微博动态推送定时任务",
            fnc: () => this.newPushTask(),
            log: !!this.weiboConfigData.pushTaskLog,
        };
    }
    weiboConfigData;
    weiboPushData;
    async newPushTask() {
        await new WeiboTask(this.e).runTask();
    }
    async addDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限添加微博动态订阅");
        }
        else {
            const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, "").trim();
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
                return true;
            }
            let subData = this.weiboPushData || { group: {}, private: {} };
            let chatType = this.e.isGroup ? "group" : "private";
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            if (!subData[chatType][chatId]) {
                subData[chatType][chatId] = [];
            }
            const upData = subData[chatType][chatId].find((item) => item.uid === uid);
            if (upData) {
                upData.type = WeiboQuery.typeHandle(upData, this.e.msg, "add");
                this.weiboPushData = subData;
                await Config.saveConfig("config", "weibo", "push", subData);
                this.e.reply(`修改微博推送动态类型成功~\n${upData.name}：${uid}`);
                return;
            }
            const res = await new WeiboGetWebData(this.e).getBloggerInfo(uid);
            if (res.statusText !== "OK") {
                this.e.reply("出了点网络问题，等会再试试吧~");
                return false;
            }
            const { ok, data } = res.data || {};
            if (ok !== 1) {
                this.e.reply(`订阅校验失败~\n博主uid：${uid} 可能是无效的，请检查后再试~`);
                return true;
            }
            const userInfo = data.userInfo || {};
            let name = uid;
            if (userInfo && (userInfo.length !== 0)) {
                name = userInfo.screen_name || uid;
            }
            subData[chatType][chatId].push({
                bot_id: this.e?.self_id,
                uid,
                name: name,
                type: WeiboQuery.typeHandle({ uid, name }, this.e.msg, "add"),
            });
            this.weiboPushData = subData;
            Config.saveConfig("config", "weibo", "push", subData);
            this.e.reply(`添加微博推送成功~\n${name}：${uid}`);
        }
    }
    async delDynamicSub() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限删除微博动态订阅");
        }
        else {
            const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, "").trim();
            if (!uid) {
                this.e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
                return;
            }
            let data = this.weiboPushData || { group: {}, private: {} };
            let chatType = this.e.isGroup ? "group" : "private";
            let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;
            if (!data[chatType][chatId]) {
                data[chatType][chatId] = [];
            }
            const upData = data[chatType][chatId].find((item) => item.uid == uid);
            if (!upData) {
                this.e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
                return;
            }
            const newType = WeiboQuery.typeHandle(upData, this.e.msg, "del");
            let isDel = false;
            if (newType.length) {
                data[chatType][chatId] = data[chatType][chatId].map((item) => {
                    if (item.uid == uid) {
                        item.type = newType;
                    }
                    return item;
                });
            }
            else {
                isDel = true;
                data[chatType][chatId] = data[chatType][chatId].filter((item) => item.uid !== uid);
            }
            this.weiboPushData = data;
            Config.saveConfig("config", "weibo", "push", data);
            this.e.reply(`${isDel ? "删除" : "修改"}微博推送成功~\n${uid}`);
        }
    }
    async allSubDynamicPushList() {
        if (!this.e.isMaster) {
            this.e.reply("未取得bot主人身份，无权限查看Bot的全部微博推送列表");
        }
        else {
            let subData = this.weiboPushData || { group: {}, private: {} };
            const messages = [];
            const typeMap = {
                DYNAMIC_TYPE_AV: "视频",
                DYNAMIC_TYPE_WORD: "图文",
                DYNAMIC_TYPE_DRAW: "图文",
                DYNAMIC_TYPE_ARTICLE: "文章",
                DYNAMIC_TYPE_FORWARD: "转发",
            };
            if (subData.group && Object.keys(subData.group).length > 0) {
                messages.push("------群组微博订阅------");
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
                messages.push("------私聊微博订阅------");
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
        let subData = this.weiboPushData || { group: {}, private: {} };
        const messages = [];
        const typeMap = {
            DYNAMIC_TYPE_AV: "视频",
            DYNAMIC_TYPE_WORD: "图文",
            DYNAMIC_TYPE_DRAW: "图文",
            DYNAMIC_TYPE_ARTICLE: "文章",
            DYNAMIC_TYPE_FORWARD: "转发",
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
    async getWeiboUserInfoByUid() {
        let uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主/g, "").trim();
        const res = await new WeiboGetWebData(this.e).getBloggerInfo(uid);
        if (res.statusText !== 'OK') {
            this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
            return;
        }
        const { ok, data } = res.data || {};
        if (ok !== 1) {
            this.e.reply(`订阅校验失败~\n博主uid：${uid} 可能是无效的，请检查后再试~`);
            return true;
        }
        const userInfo = data.userInfo || {};
        let sex = userInfo.gender === 'f' ? '女' : userInfo.gender === 'm' ? '男' : '未知';
        const message = [
            `-------微博-------`,
            `\n博主昵称：${userInfo.screen_name || ''}`,
            `\nUID：${userInfo.id || uid}`,
            `\n性别：${sex}`,
            `\n微博认证：${userInfo.verified_reason || '未认证'}`,
            `\n描述：${userInfo.description || ''}`,
            `\nsvip等级：${userInfo.svip || ''}`,
            `\nvip等级：${userInfo.mbrank || ''}`,
            `\n关注：${userInfo.follow_count || ''}`,
            `\n粉丝人数：${userInfo.followers_count_str || ''}`,
        ];
        this.e.reply(message);
    }
    async searchWeiboUserInfoByKeyword() {
        let keyword = this.e.msg.replace(/^(#|\/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主/g, "").trim();
        const res = await new WeiboGetWebData(this.e).searchBloggerInfo(keyword);
        if (res.statusText !== 'OK') {
            this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
            return;
        }
        const { ok, data } = res.data || {};
        const { user, users } = data;
        let info = user[0];
        let infos = users[0];
        let uid = info?.uid;
        let id = infos?.id;
        let nick = info?.nick;
        let screen_name = infos?.screen_name;
        let followers_count_str = infos?.followers_count_str;
        if (ok !== 1 && !info && !infos) {
            this.e.reply("惹~没有搜索到该用户捏，\n请换个关键词试试吧~ \nPS：该方法只能搜索到大V");
            return;
        }
        const messages = [];
        messages.push(`-----微博-----
      \n博主昵称：${nick || screen_name}
      \nUID：${uid || id}
      \n粉丝人数：${followers_count_str || ''}`);
        this.e.reply(messages.join("\n"));
    }
}

export { YukiWeibo as default };
