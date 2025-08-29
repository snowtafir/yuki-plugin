import { WeiboWebDataFetcher } from '@src/models/weibo/weibo.main.get.web.data';
import { WeiboMainModels } from '@src/models/weibo/weibo.main.models';
import { WeiboQuery } from '@src/models/weibo/weibo.main.query';
import { WeiboTask } from '@src/models/weibo/weibo.main.task';
import Config from '@src/utils/config';
import lodash from 'lodash';
import { EventType, Messages, Redis } from 'yunzaijs';

declare const logger: any;

const message = new Messages('message');

let weiboPushData = Config.getConfigData('config', 'weibo', 'push');

/** 定义 动态任务 函数 */
async function weiboNewPushTask(e?: EventType) {
  await new WeiboTask(e).runTask();
}

/**微博动态推送 */
message.use(
  async e => {
    await weiboNewPushTask(e);
  },
  [/^(#|\/)(yuki|优纪)?执行(微博|weibo|WEIBO)任务$/]
);

/** 添加微博动态订阅 */
message.use(
  async e => {
    if (!e.isMaster) {
      e.reply('未取得bot主人身份，无权限添加微博动态订阅');
    } else {
      // 从消息中提取UID
      const uid = e.msg.replace(/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, '').trim();
      if (!uid) {
        e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
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
      } = weiboPushData || { group: {}, private: {} };

      // 根据聊天类型初始化数据
      let chatType = e.isGroup ? 'group' : 'private';
      let chatId = e.isGroup ? e.group_id : e.user_id;

      // 初始化群组或私聊数据
      if (!subData[chatType][chatId]) {
        subData[chatType][chatId] = [];
      }

      // 检查该 uid 是否已存在
      const upData = subData[chatType][chatId].find(item => item.uid === uid);

      if (upData) {
        // 更新推送类型
        upData.type = WeiboQuery.typeHandle(upData, e.msg, 'add');
        weiboPushData = subData;
        Config.saveConfig('config', 'weibo', 'push', subData);
        e.reply(`修改微博推送动态类型成功~\n${upData.name}：${uid}`);
        return;
      }

      // 获取 微博 博主信息
      const res = await new WeiboWebDataFetcher(e).getBloggerInfo(uid);

      if (res?.statusText !== 'OK') {
        e.reply('出了点网络问题，等会再试试吧~');
        return false;
      }

      const { ok, data } = res.data || {};

      if (ok !== 1) {
        e.reply(`订阅校验失败~\n博主uid：${uid} 可能是无效的，请检查后再试~`);
        return true;
      }

      const userInfo = data.userInfo || {};
      let name = uid;

      if (userInfo && userInfo.length !== 0) {
        name = userInfo.screen_name || uid;
      }

      // 添加新的推送数据
      subData[chatType][chatId].push({
        bot_id: e?.self_id, // 使用 bot_id 对应 e_self_id
        uid,
        name: name,
        type: WeiboQuery.typeHandle({ uid, name }, e.msg, 'add')
      });

      weiboPushData = subData;
      Config.saveConfig('config', 'weibo', 'push', subData);
      e.reply(`添加微博推送成功~\n${name}：${uid}`);
    }
  },
  [/^(#|\/)(yuki|优纪)?(订阅|添加|add|ADD)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*.*$/]
);

/** 删除微博动态订阅 */
message.use(
  async e => {
    if (!e.isMaster) {
      e.reply('未取得bot主人身份，无权限删除微博动态订阅');
    } else {
      // 提取用户输入的UID
      const uid = e.msg.replace(/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g, '').trim();
      if (!uid) {
        e.reply(`请在指令末尾指定订阅的微博博主的UID！`);
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
      } = weiboPushData || { group: {}, private: {} };

      // 根据聊天类型初始化数据
      let chatType = e.isGroup ? 'group' : 'private';
      let chatId = e.isGroup ? e.group_id : e.user_id;

      // 初始化群组或私聊数据
      if (!subData[chatType][chatId]) {
        subData[chatType][chatId] = [];
      }

      // 查找指定UID的订阅数据
      const upData = subData[chatType][chatId].find((item: { uid: string }) => item.uid == uid);
      if (!upData) {
        e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
        return;
      }

      // 处理订阅类型
      const newType = WeiboQuery.typeHandle(upData, e.msg, 'del');
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
      //weiboPushData = data;
      Config.saveConfig('config', 'weibo', 'push', subData);

      // 回复用户操作结果
      e.reply(`${isDel ? '删除' : '修改'}微博推送成功~\n${uid}`);
    }
  },
  [/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*.*$/]
);

/** 扫码登录微博 */
message.use(
  async e => {
    if (!e.isMaster) {
      e.reply('未取得bot主人身份，无权限配置微博登录ck');
    } else {
      const LoginCk = await WeiboMainModels.readLoginCookie();
      if (LoginCk) {
        e.reply(`当前已有微博登录ck，请勿重复扫码！\n如需更换，请先删除当前登录再扫码：\n#yuki删除微博登录`);
      } else {
        try {
          const tokenKey = await WeiboMainModels.applyLoginQRCode(e);
          if (tokenKey && tokenKey.rid) {
            let weiboLoginCk = await WeiboMainModels.pollLoginQRCode(e, tokenKey.qrid, tokenKey.rid, tokenKey.X_CSRF_TOKEN);
            if (weiboLoginCk) {
              if (lodash.trim(weiboLoginCk).length != 0) {
                await WeiboMainModels.saveLoginCookie(e, weiboLoginCk);
                e.reply(`get weibo LoginCk：成功！`);
              } else {
                e.reply(`get weibo LoginCk：失败X﹏X`);
              }
            }
          }
        } catch (Error) {
          global?.logger?.info(`yuki-plugin Login weibo Failed：${Error}`);
        }
      }
    }
  },
  [/^(#|\/)(yuki|优纪)?(扫码|添加|ADD|add)(微博|weibo|WEIBO)登录$/]
);

/** 删除登陆的微博ck */
message.use(
  async e => {
    if (e.isMaster) {
      await Redis.set('Yz:yuki:weibo:loginCookie', '', { EX: 3600 * 24 * 180 });
      e.reply(`扫码登陆的微博cookie已删除~`);
    } else {
      e.reply('未取得bot主人身份，无权限删除微博登录ck');
    }
  },
  [/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)登录$/]
);

/** 显示我的微博登录信息 */
message.use(
  async e => {
    if (e.isMaster) {
      await WeiboMainModels.checkWeiboLogin(e);
    } else {
      e.reply('未取得bot主人身份，无权限查看微博登录状态');
    }
  },
  [/^(#|\/)(yuki|优纪)?我的(微博|weibo|WEIBO)登录$/]
);

/** 手动绑定本地获取的微博cookie */
message.use(
  async e => {
    if (e.isMaster) {
      if (e.isPrivate) {
        await e.reply('请注意账号安全，请手动撤回发送的cookie，并私聊进行添加绑定！');
      } else {
        let localBiliCookie = e.msg.replace(/^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(微博|weibo|WEIBO)(ck|CK|cookie|COOKIE)(:|：)?/g, '').trim();

        const XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(localBiliCookie, ['XSRF-TOKEN'], false);

        if (XSRF_TOKEN) {
          //筛选ck
          localBiliCookie = await WeiboMainModels.readSavedCookieItems(
            localBiliCookie,
            ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState', 'ALF'],
            false
          );

          await WeiboMainModels.saveLocalBiliCk(localBiliCookie);

          logger.mark(`${e.logFnc} 保存微博cookie成功 [XSRF_TOKEN: ${XSRF_TOKEN}]`);

          let uidMsg = [`好耶~绑定微博cookie成功：\nXSRF_TOKEN: ${XSRF_TOKEN}`];

          await e.reply(uidMsg);
        } else {
          e.reply('绑定的微博cookie无效，请检查后重新添加！');
          return false;
        }
      }
    } else {
      e.reply('未取得bot主人身份，无权限配置B站登录ck');
    }
  },
  [/^^(#|\/)(yuki|优纪)?(绑定|添加|ADD|add)(微博|weibo|WEIBO)本地(ck|CK|cookie|COOKIE)(:|：)?.*$/]
);

/** 删除绑定的本地微博ck */
message.use(
  async e => {
    if (e.isMaster) {
      await WeiboMainModels.saveLocalBiliCk('');
      await e.reply(`手动绑定的微博ck已删除~`);
    } else {
      e.reply('未取得bot主人身份，无权限删除B站登录ck');
    }
  },
  [/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)本地(ck|CK|cookie|COOKIE)$/]
);

/** 查看当前正在使用的本地微博ck */
message.use(
  async e => {
    if (e.isGroup) {
      await e.reply('注意账号安全，请私聊查看叭');
    } else {
      if (e.isMaster) {
        let { cookie, mark } = await WeiboMainModels.readSyncCookie();
        if (mark === 'localCk') {
          e.reply(`当前使用本地获取的微博cookie：`);
          e.reply(`${cookie}`);
        } else if (mark === 'loginCk') {
          e.reply(`当前使用扫码登录的微博cookie：`);
          e.reply(`${cookie}`);
        } else if (mark == 'ckIsEmpty') {
          e.reply(`当前无可使用的微博cookie。`);
        }
      } else {
        e.reply('未取得bot主人身份，无权限查看当前使用的B站cookie');
      }
    }
  },
  [/^(#|\/)(yuki|优纪)?我的(微博|weibo|WEIBO)(ck|CK|cookie|COOKIE)$/]
);

/** 订阅的全部微博推送列表 */
message.use(
  async e => {
    if (!e.isMaster) {
      e.reply('未取得bot主人身份，无权限查看Bot的全部微博推送列表');
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
      } = weiboPushData || { group: {}, private: {} };

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
          if (subData.group) {
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
          }
        });
      } else {
        messages.push('\n>>>>>>群组微博订阅<<<<<<\n当前没有任何群组订阅数据~');
      }

      // 处理私聊订阅
      if (subData.private && Object.keys(subData.private).length > 0) {
        messages.push('\n>>>>>>私聊微博订阅<<<<<<');
        Object.keys(subData.private).forEach(userId => {
          messages.push(`\n<用户${userId}>：`);
          if (subData.private) {
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
          }
        });
      } else {
        messages.push('\n>>>>>>私聊微博订阅<<<<<<\n当前没有任何私聊订阅数据~');
      }

      e.reply(`推送列表如下：\n${messages.join('\n')}`);
    }
  },
  [/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)全部(推送|动态|订阅)列表$/]
);

/** 单独群聊或私聊的订阅的b站推送列表 */
message.use(
  async e => {
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
    } = weiboPushData || { group: {}, private: {} };

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
    let chatType = e.isGroup ? 'group' : 'private';
    let chatId = e.isGroup ? e.group_id : e.user_id;

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

    e.reply(`推送列表如下：\n${messages.join('\n')}`);
  },
  [/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(推送|动态|订阅)列表$/]
);

/**通过uid获取up主信息 */
message.use(
  async e => {
    let uid = e.msg.replace(/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主/g, '').trim();

    const res = await new WeiboWebDataFetcher(e).getBloggerInfo(uid);

    if (res?.statusText !== 'OK') {
      e.reply('诶嘿，出了点网络问题，等会再试试吧~');
      return;
    }

    const { ok, data } = res.data || {};

    if (ok !== 1) {
      e.reply(`订阅校验失败~\n博主uid：${uid} 可能是无效的，请检查后再试~`);
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

    e.reply(message);
  },
  [/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主.*$/]
);

/** 根据昵称搜索博主信息*/
message.use(
  async e => {
    let keyword = e.msg.replace(/^(#|\/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主/g, '').trim();

    const res = await new WeiboWebDataFetcher(e).searchBloggerInfo(keyword);

    if (res?.statusText !== 'OK') {
      e.reply('诶嘿，出了点网络问题，等会再试试吧~');
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
      e.reply('惹~没有搜索到该用户捏，\n请换个关键词试试吧~ \nPS：该方法只能搜索到大V');
      return;
    }

    const messages: string[] = [];

    messages.push(
      `-----微博-----
      \n博主昵称：${nick || screen_name}
      \nUID：${uid || id}
      \n粉丝人数：${followers_count_str || ''}`
    );

    e.reply(messages.join('\n'));
  },
  [/^(#|\/)(yuki|优纪)?搜索(微博|weibo|WEIBO)(博|bo|BO)主.*$/]
);

export const YukiWeibo = message.ok;
