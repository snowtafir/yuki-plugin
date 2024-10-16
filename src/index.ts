import chalk from 'chalk';
import { Application, applicationOptions, EventType, setBotTask, useEvent } from 'yunzaijs';
import Config from '@/utils/config';
import path from 'path';
import { _paths } from '@/utils/paths';
import * as apps from '@/apps/index';
import { BiliTask } from '@/models/bilibili/bilibili.task';
import { WeiboTask } from '@/models/weibo/weibo.task';
declare const logger: any;
type RulesType = {
  reg: RegExp | string;
  key: string;
}[];

const yukiPluginVersion = Config.getPackageJsonKey('version', path.join(_paths.pluginPath, 'package.json'));

let biliConfigData = Config.getConfigData('config', 'bilibili', 'config');
let weiboConfigData = Config.getConfigData('config', 'weibo', 'config');

/** B站动态任务 函数 */
async function biliNewPushTask(e?: EventType) {
  await new BiliTask(e).runTask();
}

/** 微博动态任务 函数 */
async function weiboNewPushTask(e?: EventType) {
  await new WeiboTask(e).runTask();
}

export default () => {
  // 预先存储
  const rules: RulesType = [];
  // options
  return applicationOptions({
    create() {
      // created
      for (const key in apps) {
        // 推类型
        const app: typeof Application.prototype = new apps[key]();
        // 用  reg 和 key 连接起来。
        // 也可以进行自由排序
        for (const rule of app.rule) {
          rules.push({
            reg: rule.reg,
            key: key
          });
        }
      }
      logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));
      logger.info(chalk.rgb(255, 225, 255)(`优纪插件 ${yukiPluginVersion} 初始化~`));
      logger.info(chalk.rgb(255, 245, 255)(`作者：snowtafir`));
      logger.info(chalk.rgb(255, 225, 255)(`仓库地址：`));
      logger.info(chalk.rgb(255, 245, 255)(`https://github.com/snowtafir/yuki-plugin`));
      logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));
      logger.info(chalk.rgb(0, 190, 255)(`★ 优纪插件加载完成了喵~`));

      /** B站动态推送定时任务 */
      setBotTask(
        async Bot => {
          try {
            biliNewPushTask();
            if (biliConfigData.pushTaskLog) {
              Bot.logger.mark('yuki插件---B站动态推送定时任务');
            }
          } catch (err) {
            console.error('B站动态推送定时任务', err);
          }
        },
        biliConfigData.pushStatus ? biliConfigData.pushTime : ''
      );

      /** 微博动态推送定时任务 */
      setBotTask(
        async Bot => {
          try {
            await weiboNewPushTask();
            if (weiboConfigData.pushTaskLog) {
              Bot.logger.mark('yuki插件---微博动态推送定时任务');
            }
          } catch (err) {
            console.error('微博动态推送定时任务', err);
          }
        },
        weiboConfigData.pushStatus ? weiboConfigData.pushTime : ''
      );
    },
    async mounted(e) {
      // 存储
      const data = [];
      // 如果key不存在
      const cache = {};
      // 使用event以确保得到正常类型
      await useEvent(
        e => {
          for (const item of rules) {
            // 匹配正则
            // 存在key
            // 第一次new
            if (new RegExp(item.reg).test(e.msg) && apps[item.key] && !cache[item.key]) {
              cache[item.key] = true;
              data.push(new apps[item.key]());
            }
          }
        },
        // 推倒为message类型的event
        [e, 'message']
      );
      // back
      return data;
    }
  });
};
