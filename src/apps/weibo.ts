import { Messages, EventType } from 'yunzaijs';
import { WeiboQuery } from '@src/models/weibo/weibo.main.query';
import { WeiboTask } from '@src/models/weibo/weibo.main.task';
import Config from '@src/utils/config';
import { _paths } from '@src/utils/paths';
import { WeiboGetWebData } from '@src/models/weibo/weibo.main.get.web.data';

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
      let subData = weiboPushData || { group: {}, private: {} };

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
      const res = await new WeiboGetWebData(e).getBloggerInfo(uid);

      if (res.statusText !== 'OK') {
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
      let data = weiboPushData || { group: {}, private: {} };

      // 根据聊天类型初始化数据
      let chatType = e.isGroup ? 'group' : 'private';
      let chatId = e.isGroup ? e.group_id : e.user_id;

      // 初始化群组或私聊数据
      if (!data[chatType][chatId]) {
        data[chatType][chatId] = [];
      }

      // 查找指定UID的订阅数据
      const upData = data[chatType][chatId].find((item: { uid: string }) => item.uid == uid);
      if (!upData) {
        e.reply(`订阅列表中没有找到该UID~\n${uid}可能是无效的`);
        return;
      }

      // 处理订阅类型
      const newType = WeiboQuery.typeHandle(upData, e.msg, 'del');
      let isDel = false;

      if (newType.length) {
        // 更新订阅类型
        data[chatType][chatId] = data[chatType][chatId].map(item => {
          if (item.uid == uid) {
            item.type = newType;
          }
          return item;
        });
      } else {
        // 删除订阅
        isDel = true;
        data[chatType][chatId] = data[chatType][chatId].filter((item: { uid: string }) => item.uid !== uid);
      }

      // 保存更新后的数据
      //weiboPushData = data;
      Config.saveConfig('config', 'weibo', 'push', data);

      // 回复用户操作结果
      e.reply(`${isDel ? '删除' : '修改'}微博推送成功~\n${uid}`);
    }
  },
  [/^(#|\/)(yuki|优纪)?(取消|删除|del|DEL)(微博|weibo|WEIBO)推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*.*$/]
);

/** 订阅的全部微博推送列表 */
message.use(
  async e => {
    if (!e.isMaster) {
      e.reply('未取得bot主人身份，无权限查看Bot的全部微博推送列表');
    } else {
      let subData = weiboPushData || { group: {}, private: {} };

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
        messages.push('------群组微博订阅------');
        Object.keys(subData.group).forEach(groupId => {
          messages.push(`群组ID：${groupId}：`);
          subData.group[groupId].forEach((item: { type: any[]; uid: any; name: any }) => {
            const types = new Set();

            if (item.type && item.type.length) {
              item.type.forEach((typeItem: string | number) => {
                if (typeMap[typeItem]) {
                  types.add(typeMap[typeItem]);
                }
              });
            }

            messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
          });
        });
      }

      // 处理私聊订阅
      if (subData.private && Object.keys(subData.private).length > 0) {
        messages.push('------私聊微博订阅------');
        Object.keys(subData.private).forEach(userId => {
          messages.push(`用户ID：${userId}：`);
          subData.private[userId].forEach((item: { type: any[]; uid: any; name: any }) => {
            const types = new Set();

            if (item.type && item.type.length) {
              item.type.forEach((typeItem: string | number) => {
                if (typeMap[typeItem]) {
                  types.add(typeMap[typeItem]);
                }
              });
            }

            messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
          });
        });
      }

      e.reply(`推送列表如下：\n${messages.join('\n')}`);
    }
  },
  [/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)全部(推送|动态|订阅)列表$/]
);

/** 单独群聊或私聊的订阅的b站推送列表 */
message.use(
  async e => {
    let subData = weiboPushData || { group: {}, private: {} };

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

      messages.push(`${item.name}：${item.uid}  ${types.size ? `[${Array.from(types).join('、')}]` : ' [全部动态]'}`);
    });

    e.reply(`推送列表如下：\n${messages.join('\n')}`);
  },
  [/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(推送|动态|订阅)列表$/]
);

/**通过uid获取up主信息 */
message.use(
  async e => {
    let uid = e.msg.replace(/^(#|\/)(yuki|优纪)?(微博|weibo|WEIBO)(博|bo|BO)主/g, '').trim();

    const res = await new WeiboGetWebData(e).getBloggerInfo(uid);

    if (res.statusText !== 'OK') {
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

    const res = await new WeiboGetWebData(e).searchBloggerInfo(keyword);

    if (res.statusText !== 'OK') {
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
