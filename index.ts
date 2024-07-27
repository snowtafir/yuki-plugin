import chalk from 'chalk';
import Config from './utils/config';
import { _paths } from './utils/paths';
import YukiBili  from './apps/bilibili';
import YukiHelp  from './apps/help.ts';
import YukiUpdate  from './apps/update';
import YukiVersion from './apps/version';
import YukiWeibo  from './apps/weibo';


let apps = { YukiBili, YukiHelp, YukiUpdate, YukiVersion, YukiWeibo }
let rules = {}
let count = 0;
for (let key in apps) {
  if (!apps[key]) {
    logger.error(`载入插件错误：${[key]}`);
    continue;
  }
  rules[`${key}`] = apps[key];
  count++;
}

declare const logger: any;

logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));
logger.info(chalk.rgb(255, 225, 255)(`|优纪插件 ${Config.getLatestVersion()} 初始化~`));
logger.info(chalk.rgb(255, 245, 255)(`|作者：snowtafir`));
logger.info(chalk.rgb(255, 225, 255)(`|仓库地址：`));
logger.info(chalk.rgb(255, 245, 255)(`|https://github.com/snowtafir/yuki-plugin`));
logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));


logger.info(chalk.rgb(0, 190, 255)(`★ 优纪插件加载完成，共计加载${count}个app`))

export { rules as apps };
