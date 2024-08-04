import chalk from 'chalk';
import { applicationOptions, useAppStorage } from 'yunzai';
import Config from './utils/config';
import * as apps from './apps/index';
declare const logger: any;
const Data = useAppStorage()
export default () => {
  return applicationOptions({
    create() {
      let count = 0;
      for (const key in apps) {
        Data.push(new apps[key]())
        count++
      }
      logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));
      logger.info(chalk.rgb(255, 225, 255)(`|优纪插件 ${Config.getLatestVersion()} 初始化~`));
      logger.info(chalk.rgb(255, 245, 255)(`|作者：snowtafir`));
      logger.info(chalk.rgb(255, 225, 255)(`|仓库地址：`));
      logger.info(chalk.rgb(255, 245, 255)(`|https://github.com/snowtafir/yuki-plugin`));
      logger.info(chalk.rgb(0, 190, 255)(`-----------------------------------------`));
      logger.info(chalk.rgb(0, 190, 255)(`★ 优纪插件加载完成，共计加载${count}个app`));
    },
    mounted() {
      return Data
    }
  })
}
