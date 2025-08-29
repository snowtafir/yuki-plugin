import { WeiboWebDataFetcher } from '@/models/weibo/weibo.main.get.web.data';
import { WeiboMainModels } from '@/models/weibo/weibo.main.models';
import { WeiboQuery } from '@/models/weibo/weibo.main.query';
import { WeiboTask } from '@/models/weibo/weibo.main.task';
import Config from '@/utils/config';
import { hostType, Plugin, Redis } from '@/utils/host';
import lodash from 'lodash';

export default class YukiWeibo extends Plugin {
  constructor() {
    const rules = [
      {
        reg: '^(#|/)(yuki|优纪)?执行(微博|weibo|WEIBO)任务$',
        fnc: 'newPushTask',
        permission: 'master'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$',
        fnc: 'addDynamicSub'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$',
        fnc: 'delDynamicSub'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(微博|weibo|WEIBO)全部(推送|动态|订阅)列表$',
        fnc: 'allSubDynamicPushList'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(微博|weibo|WEIBO)(推送|动态|订阅)列表$',
        fnc: 'singelSubDynamicPushList'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主.*$',
        fnc: 'getWeiboUserInfoByUid'
      },
      {
        reg: '^(#|/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主.*$',
        fnc: 'searchWeiboUserInfoByKeyword'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(扫码|添加|ADD|add)(微博|weibo|WEIBO)登录$',
        fnc: 'scanWeiboLogin'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)登录$',
        fnc: 'delWeiboLogin'
      },
      {
        reg: '^(#|/)(yuki|优纪)?我的(微博|weibo|WEIBO)登录$',
        fnc: 'myWeiboLoginInfo'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(绑定|添加|ADD|add)(微博|weibo|WEIBO)本地(ck|CK|cookie|COOKIE)(:|：)?.*$',
        fnc: 'addLocalWeiboCookie'
      },
      {
        reg: '^(#|/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)本地(ck|CK|cookie|COOKIE)$',
        fnc: 'delLocalWeiboCookie'
      },
      {
        reg: '^(#|/)(yuki|优纪)?我的(微博|weibo|WEIBO)(ck|CK|cookie|COOKIE)$',
        fnc: 'myUsingWeiboCookie'
      }
    ];
    if (hostType === 'yunzaijs') {
      super();
      this.rule = rules.map(r => ({ ...r, fnc: this[r.fnc].name }));
    } else {
      super({ rule: rules });
    }
    this.weiboConfigData = Config.getConfigData('config', 'weibo', 'config');
    this.weiboPushData = Config.getConfigData('config', 'weibo', 'push');
    this.task = {
      cron: !!this.weiboConfigData.pushStatus ? (this.weiboConfigData.checkDynamicCD ? this.weiboConfigData.checkDynamicCD : '*/23  * * * *') : '',
      name: 'yuki插件---微博动态推送定时任务',
      fnc: () => this.newPushTask(),
      log: !!this.weiboConfigData.pushTaskLog
    };
  }
  weiboConfigData: any;
  weiboPushData: any;

  /** 微博动态推送定时任务 */
  async newPushTask() {
    await new WeiboTask(this.e).runTask();
  }

  /** 添加微博动态订阅 */
  async addDynamicSub() {
    if (!this.e.isMaster) {
      this.e.reply('未取得bot主人身份，无权限添加微博动态订阅');
    } else {
      // 从消息中提取UID
      const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, '').trim();
      if (!uid) {
        this.e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
        return true;
      }

      // 获取或初始化推送数据
      let subData: {
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
      } = this.weiboPushData || { group: {}, private: {} };

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
        upData.type = WeiboQuery.typeHandle(upData, this.e.msg, 'add');
        this.weiboPushData = subData;
        await Config.saveConfig('config', 'weibo', 'push', subData);
        this.e.reply(`修改微博推送动态类型成功~\n${upData.name}：${uid}`);
        return;
      }

      // 获取 微博 博主信息
      const res = await new WeiboWebDataFetcher(this.e).getBloggerInfo(uid);

      if (res?.statusText !== 'OK') {
        this.e.reply('出了点网络问题，等会再试试吧~');
        return false;
      }

      const { ok, data } = res.data || {};

      if (ok !== 1) {
        this.e.reply(`订阅校验失败~\n博主uid：${uid} 可能是无效的，请检查后再试~`);
        return true;
      }

      const userInfo = data.userInfo || {};
      let name = uid;

      if (userInfo && userInfo.length !== 0) {
        name = userInfo.screen_name || uid;
      }

      // 添加新的推送数据
      subData[chatType][chatId].push({
        bot_id: this.e?.self_id, // 使用 bot_id 对应 e_self_id
        uid,
        name: name,
        type: WeiboQuery.typeHandle({ uid, name }, this.e.msg, 'add')
      });

      this.weiboPushData = subData;
      Config.saveConfig('config', 'weibo', 'push', subData);
      this.e.reply(`添加微博推送成功~\n${name}：${uid}`);
    }
  }

  /** 删除微博动态订阅 */
  async delDynamicSub() {
    if (!this.e.isMaster) {
      this.e.reply('未取得bot主人身份，无权限删除微博动态订阅');
    } else {
      // 提取用户输入的UID
      const uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, '').trim();
      if (!uid) {
        this.e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
        return;
      }

      // 获取或初始化微博推送数据
      let subData: {
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
      } = this.weiboPushData || { group: {}, private: {} };

      // 根据聊天类型初始化数据
      let chatType = this.e.isGroup ? 'group' : 'private';
      let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;

      // 初始化群组或私聊数据
      if (!subData[chatType][chatId]) {
        subData[chatType][chatId] = [];
      }

      // 查找指定UID的订阅数据
      const upData = subData[chatType][chatId].find((item: { uid: string }) => item.uid == uid);
      if (!upData) {
        this.e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
        return;
      }

      // 处理订阅类型
      const newType = WeiboQuery.typeHandle(upData, this.e.msg, 'del');
      let isDel = false;

      if (newType.length) {
        // 更新订阅类型
        subData[chatType][chatId] = subData[chatType][chatId].map(item => {
          if (item.uid == uid) {
            item.type = newType;
          }
          return item;
        });
      } else {
        // 删除订阅
        isDel = true;
        subData[chatType][chatId] = subData[chatType][chatId].filter((item: { uid: string }) => item.uid !== uid);
      }

      // 保存更新后的数据
      this.weiboPushData = subData;
      Config.saveConfig('config', 'weibo', 'push', subData);

      // 回复用户操作结果
      this.e.reply(`${isDel ? '删除' : '修改'}微博推送成功~\n${uid}`);
    }
  }

  /** 订阅的全部微博推送列表 */
  async allSubDynamicPushList() {
    if (!this.e.isMaster) {
      this.e.reply('未取得bot主人身份，无权限查看Bot的全部微博推送列表');
    } else {
      let subData: {
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
      } = this.weiboPushData || { group: {}, private: {} };

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

      const messages: string[] = [];

      const typeMap = {
        DYNAMIC_TYPE_AV: '视频',
        DYNAMIC_TYPE_WORD: '图文',
        DYNAMIC_TYPE_DRAW: '图文',
        DYNAMIC_TYPE_ARTICLE: '文章',
        DYNAMIC_TYPE_FORWARD: '转发'
      };

      // 处理群组订阅
      if (subData.group && Object.keys(subData.group).length > 0) {
        messages.push('\n>>>>>>群组微博订阅<<<<<<');
        Object.keys(subData.group).forEach(groupId => {
          messages.push(`\n<群组${groupId}>：`);
          subData.group[groupId].forEach((item: { type: any[]; uid: any; name: any }) => {
            const types = new Set();

            if (item.type && item.type.length) {
              item.type.forEach((typeItem: string | number) => {
                if (typeMap[typeItem]) {
                  types.add(typeMap[typeItem]);
                }
              });
            }

            messages.push(`${item.uid}：${item.name}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
          });
        });
      } else {
        messages.push('\n>>>>>>群组微博订阅<<<<<<\n当前没有任何群组订阅数据~');
      }

      // 处理私聊订阅
      if (subData.private && Object.keys(subData.private).length > 0) {
        messages.push('\n>>>>>>私聊微博订阅<<<<<<');
        Object.keys(subData.private).forEach(userId => {
          messages.push(`\n<用户${userId}>：`);
          subData.private[userId].forEach((item: { type: any[]; uid: any; name: any }) => {
            const types = new Set();

            if (item.type && item.type.length) {
              item.type.forEach((typeItem: string | number) => {
                if (typeMap[typeItem]) {
                  types.add(typeMap[typeItem]);
                }
              });
            }

            messages.push(`${item.uid}：${item.name}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
          });
        });
      } else {
        messages.push('\n>>>>>>私聊微博订阅<<<<<<\n当前没有任何私聊订阅数据~');
      }

      this.e.reply(`推送列表如下：\n${messages.join('\n')}`);
    }
  }

  /** 单独群聊或私聊的订阅的b站推送列表 */
  async singelSubDynamicPushList() {
    let subData: {
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
    } = this.weiboPushData || { group: {}, private: {} };

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

    const messages: string[] = [];

    const typeMap = {
      DYNAMIC_TYPE_AV: '视频',
      DYNAMIC_TYPE_WORD: '图文',
      DYNAMIC_TYPE_DRAW: '图文',
      DYNAMIC_TYPE_ARTICLE: '文章',
      DYNAMIC_TYPE_FORWARD: '转发'
    };

    // 根据聊天类型初始化数据
    let chatType = this.e.isGroup ? 'group' : 'private';
    let chatId = this.e.isGroup ? this.e.group_id : this.e.user_id;

    if (!subData[chatType][chatId]) {
      subData[chatType][chatId] = [];
    }

    subData[chatType][chatId].forEach((item: { type: any[]; uid: any; name: any }) => {
      const types = new Set();

      if (item.type && item.type.length) {
        item.type.forEach((typeItem: string | number) => {
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
  async getWeiboUserInfoByUid() {
    let uid = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主/g, '').trim();

    const res = await new WeiboWebDataFetcher(this.e).getBloggerInfo(uid);

    if (res?.statusText !== 'OK') {
      this.e.reply('诶嘿，出了点网络问题，等会再试试吧~');
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
      `\n粉丝人数：${userInfo.followers_count_str || ''}`
    ];

    this.e.reply(message);
  }

  /** 根据昵称搜索博主信息*/
  async searchWeiboUserInfoByKeyword() {
    let keyword = this.e.msg.replace(/^(#|\/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主/g, '').trim();

    const res = await new WeiboWebDataFetcher(this.e).searchBloggerInfo(keyword);

    if (res?.statusText !== 'OK') {
      this.e.reply('诶嘿，出了点网络问题，等会再试试吧~');
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
      this.e.reply('惹~没有搜索到该用户捏，\n请换个关键词试试吧~ \nPS：该方法只能搜索到大V');
      return;
    }

    const messages: string[] = [];

    messages.push(
      `-----微博-----
      \n博主昵称：${nick || screen_name}
      \nUID：${uid || id}
      \n粉丝人数：${followers_count_str || ''}`
    );

    this.e.reply(messages.join('\n'));
  }
  /** 扫码登录微博 */
  async scanWeiboLogin() {
    if (!this.e.isMaster) {
      this.e.reply('未取得bot主人身份，无权限配置微博登录ck');
    } else {
      const LoginCk = await WeiboMainModels.readLoginCookie();
      const SUB = await WeiboMainModels.readSavedCookieItems(LoginCk, ['SUB'], false);
      const SUBP = await WeiboMainModels.readSavedCookieItems(LoginCk, ['SUBP'], false);
      if (LoginCk && SUB && SUBP) {
        this.e.reply(`当前已有微博登录ck，请勿重复扫码！\n如需更换，请先删除当前登录再扫码：\n#yuki删除微博登录`);
      } else {
        try {
          const tokenKey = await WeiboMainModels.applyLoginQRCode(this.e);
          if (tokenKey && tokenKey.rid) {
            let weiboLoginCk = await WeiboMainModels.pollLoginQRCode(this.e, tokenKey.qrid, tokenKey.rid, tokenKey.X_CSRF_TOKEN);
            if (weiboLoginCk) {
              if (lodash.trim(weiboLoginCk).length != 0) {
                await WeiboMainModels.saveLoginCookie(this.e, weiboLoginCk);
                this.e.reply(`get weibo LoginCk：成功！`);
              } else {
                this.e.reply(`get weibo LoginCk：失败X﹏X`);
              }
            }
          }
        } catch (Error) {
          global?.logger?.info(`yuki-plugin Login weibo Failed：${Error}`);
        }
      }
    }
  }

  /** 删除登陆的微博ck */
  async delWeiboLogin() {
    if (this.e.isMaster) {
      await Redis.set('Yz:yuki:weibo:loginCookie', '', { EX: 3600 * 24 * 180 });
      this.e.reply(`扫码登陆的微博cookie已删除~`);
    } else {
      this.e.reply('未取得bot主人身份，无权限删除微博登录ck');
    }
  }
  /** 显示我的微博登录信息 */
  async myWeiboLoginInfo() {
    if (this.e.isMaster) {
      await WeiboMainModels.checkWeiboLogin(this.e);
    } else {
      this.e.reply('未取得bot主人身份，无权限查看微博登录状态');
    }
  }

  /** 手动绑定本地获取的微博cookie */
  async addLocalWeiboCookie() {
    if (this.e.isMaster) {
      if (this.e.isPrivate) {
        await this.e.reply('请注意账号安全，请手动撤回发送的cookie，并私聊进行添加绑定！');
      } else {
        let localBiliCookie = this.e.msg.replace(/^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(微博|weibo|WEIBO)(ck|CK|cookie|COOKIE)(:|：)?/g, '').trim();

        const XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(localBiliCookie, ['XSRF-TOKEN'], false);

        if (XSRF_TOKEN) {
          //筛选ck
          localBiliCookie = await WeiboMainModels.readSavedCookieItems(
            localBiliCookie,
            ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState', 'ALF'],
            false
          );

          await WeiboMainModels.saveLocalBiliCk(localBiliCookie);

          logger.mark(`${this.e.logFnc} 保存微博cookie成功 [XSRF_TOKEN: ${XSRF_TOKEN}]`);

          let uidMsg = [`好耶~绑定微博cookie成功：\nXSRF_TOKEN: ${XSRF_TOKEN}`];

          await this.e.reply(uidMsg);
        } else {
          this.e.reply('绑定的微博cookie无效，请检查后重新添加！');
          return false;
        }
      }
    } else {
      this.e.reply('未取得bot主人身份，无权限配置B站登录ck');
    }
  }
  /** 删除绑定的本地微博ck */
  async delLocalWeiboCookie() {
    if (this.e.isMaster) {
      await WeiboMainModels.saveLocalBiliCk('');
      await this.e.reply(`手动绑定的微博ck已删除~`);
    } else {
      this.e.reply('未取得bot主人身份，无权限删除B站登录ck');
    }
  }
  /** 查看当前正在使用的本地微博ck */
  async myUsingWeiboCookie() {
    if (this.e.isGroup) {
      await this.e.reply('注意账号安全，请私聊查看叭');
    } else {
      if (this.e.isMaster) {
        let { cookie, mark } = await WeiboMainModels.readSyncCookie();
        if (mark === 'localCk') {
          this.e.reply(`当前使用本地获取的微博cookie：`);
          this.e.reply(`${cookie}`);
        } else if (mark === 'loginCk') {
          this.e.reply(`当前使用扫码登录的微博cookie：`);
          this.e.reply(`${cookie}`);
        } else if (mark == 'ckIsEmpty') {
          this.e.reply(`当前无可使用的微博cookie。`);
        }
      } else {
        this.e.reply('未取得bot主人身份，无权限查看当前使用的B站cookie');
      }
    }
  }
}
