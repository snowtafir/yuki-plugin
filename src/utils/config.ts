import * as fs from 'fs';
import YAML from 'yaml';
import chokidar from "chokidar";
import lodash from "lodash";
import path from 'path';
import { _paths } from "./paths";

// 声明 logger 为全局变量
declare const logger: any;

/**
 * Config 类用于管理配置文件的读取和监听
 */
class Config {
  readonly versionPath: string;
  readonly defaultConfigPath: string;
  readonly userConfigPath: string;
  defaultConfig: Record<string, any>;
  userConfig: Record<string, any>;
  watcher: Record<string, chokidar.FSWatcher>;

  constructor() {
    this.versionPath = path.join(_paths.pluginPath, 'CHANGELOG.md');
    /** 默认设置 */
    this.defaultConfigPath = path.join(_paths.pluginPath, 'defaultConfig');
    this.defaultConfig = {};
    /** 用户设置 */
    this.userConfigPath = path.join(_paths.pluginPath, 'config');
    this.userConfig = {};
    /** 监听文件 */
    this.watcher = {};
    this.initConfigFiles();
  }

  /** 操作并创建配置文件到指定目录 */
  initConfigFiles() {
    let bilibiliSetFile = path.join(_paths.pluginPath, 'config/bilibili/config.yaml');
    let bilibiliPushFile = path.join(_paths.pluginPath, 'config/bilibili/push.yaml');
    let weiboSetFile = path.join(_paths.pluginPath, 'config/weibo/config.yaml');
    let weiboPushFile = path.join(_paths.pluginPath, 'config/weibo/push.yaml');

    const configFiles = [
      { file: bilibiliSetFile, defaultFile: path.join(_paths.pluginPath, 'defaultConfig/bilibili/config.yaml'), dir: 'config/bilibili' },
      { file: bilibiliPushFile, defaultFile: path.join(_paths.pluginPath, 'defaultConfig/bilibili/push.yaml'), dir: 'config/bilibili' },
      { file: weiboSetFile, defaultFile: path.join(_paths.pluginPath, 'defaultConfig/weibo/config.yaml'), dir: 'config/weibo' },
      { file: weiboPushFile, defaultFile: path.join(_paths.pluginPath, 'defaultConfig/weibo/push.yaml'), dir: 'config/weibo' }
    ];

    for (const { file, defaultFile, dir } of configFiles) {
      if (!fs.existsSync(file)) {
        const configDir = path.join(_paths.pluginPath, dir);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        fs.copyFileSync(defaultFile, file);
      }
    }
  }
  /**
   * 通用获取配置文件数据方法
   * @param typeDir 插件为起始的配置文件目录
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @returns {object} 配置数据
   */
  getConfigData(typeDir: string, appDir: string, functionName: string) {
    const configFilePath = this.getConfigFilePath(typeDir, appDir, functionName);
    const key = `${typeDir}_${appDir}_${functionName}`;

    if (this[key]) return this[key];

    this[key] = YAML.parse(fs.readFileSync(configFilePath, "utf8"));

    this.watch(configFilePath, typeDir, appDir, functionName);

    return this[key];
  }

  /**
   * 获取配置文件路径
   * @param typeDir 插件为起始的配置文件目录
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @returns {string} 配置文件路径
   */
  getConfigFilePath(typeDir: string, appDir: string, functionName: string): string {
    return path.join(_paths.pluginPath, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
  }

  /**
   * 监听配置文件的变化
   * @param configFilePath 文件路径
   * @param typeDir 插件为起始的配置文件目录
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   */
  watch(configFilePath: string, typeDir: string, appDir: string, functionName: string) {
    const key = `${typeDir}_${appDir}_${functionName}`;

    if (this.watcher[key]) return;

    const watcher = chokidar.watch(configFilePath);
    watcher.on("change", () => {
      delete this[key];
      logger.mark(`[修改配置文件][${typeDir}][${appDir}][${functionName}]`);
      if (this[`change_${appDir}${functionName}`]) {
        this[`change_${appDir}${functionName}`]();
      }
    });

    this.watcher[key] = watcher;
  }

  /**
   * 获取默认配置
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   */
  getDefaultConfig(appDir: string, functionName: string) {
    return this.getConfigData("defaultConfig", appDir, functionName);
  }

  /**
   * 获取用户配置
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   */
  getUserConfig(appDir: string, functionName: string) {
    const userConfigData = this.getConfigData("config", appDir, functionName);
    const defaultConfigData = this.getDefaultConfig(appDir, functionName);

    return lodash.merge({}, defaultConfigData, userConfigData);
  }

  /**
   * 保存配置文件
   * @param typeDir 插件为起始的配置文件目录
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @param data 配置数据
   */
  saveConfig(typeDir: string, appDir: string, functionName: string, data: any) {
    const filePath = this.getConfigFilePath(typeDir, appDir, functionName);
    if (lodash.isEmpty(data)) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
    } else {
      const yamlContent = YAML.stringify(data);
      fs.writeFileSync(filePath, yamlContent, "utf8");
    }
  }

  /**
   * 更新并保存配置项
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @param key 配置项的键
   * @param value 配置项的值
   */
  updateConfigItem(appDir: string, functionName: string, key: string, value: any): void {
    const config = this.getUserConfig(appDir, functionName);
    config[key] = value; // 更新配置项
    this.saveConfig("config", appDir, functionName, config); // 保存更新后的配置
  }

  /** 读取CHANGELOG.md文件，获取最新版本号*/
  getLatestVersion(): string | null {
    const content = fs.readFileSync(this.versionPath, 'utf-8');
    const versionPattern = /#\s(\d+\.\d+\.\d+)/g;
    const match = versionPattern.exec(content);

    if (match) {
      return match[1];
    } else {
      return null;
    }
  }
}

export default new Config();