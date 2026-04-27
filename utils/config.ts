import * as fs from 'fs';
import YAML from 'yaml';
import * as chokidar from 'chokidar';
import lodash from 'lodash';
import path from 'path';
import { _paths } from '@/utils/paths';

// 声明 logger 为全局变量
declare const logger: any;

/**
 * Config 类用于管理配置文件的读取和监听
 */
class Config {
  readonly defaultConfigPath: string;
  readonly userConfigPath: string;
  defaultConfig: Record<string, any>;
  userConfig: Record<string, any>;
  watcher: Record<string, chokidar.FSWatcher>;

  constructor() {
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
    const configFiles = [
      {
        configFile: path.join(_paths.botYukiData, 'config/bilibili/config.yaml'),
        defaultFile: path.join(_paths.pluginPath, 'defaultConfig/bilibili/config.yaml'),
        dir: 'config/bilibili'
      },
      {
        configFile: path.join(_paths.botYukiData, 'config/bilibili/push.yaml'),
        defaultFile: path.join(_paths.pluginPath, 'defaultConfig/bilibili/push.yaml'),
        dir: 'config/bilibili'
      },
      {
        configFile: path.join(_paths.botYukiData, 'config/weibo/config.yaml'),
        defaultFile: path.join(_paths.pluginPath, 'defaultConfig/weibo/config.yaml'),
        dir: 'config/weibo'
      },
      {
        configFile: path.join(_paths.botYukiData, 'config/weibo/push.yaml'),
        defaultFile: path.join(_paths.pluginPath, 'defaultConfig/weibo/push.yaml'),
        dir: 'config/weibo'
      }
    ];

    for (const { configFile, defaultFile, dir } of configFiles) {
      if (!fs.existsSync(configFile)) {
        const configDir = path.join(_paths.botYukiData, dir);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        fs.copyFileSync(defaultFile, configFile);
      }
    }
  }
  /**
   * 获取 Guoba 配置文件路径
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @returns {string} Guoba 配置文件路径
   */
  getGuobaConfigFilePath(appDir: string, functionName: string): string {
    return path.join(_paths.botYukiData, 'config', appDir, `${functionName}.guoba.support.yaml`);
  }

  /**
   * 检查 Guoba 配置文件是否存在
   * @param appDir 配置app目录
   * @param functionName 配置文件名称
   * @returns {boolean} 是否存在
   */
  hasGuobaConfig(appDir: string, functionName: string): boolean {
    const guobaPath = this.getGuobaConfigFilePath(appDir, functionName);
    return fs.existsSync(guobaPath);
  }

  /**
   * 读取 Guoba 配置文件
   * @param appDir 配置app目录
   * @param functionName 配置文件名称
   * @returns {object|null} 配置数据，不存在则返回 null
   */
  readGuobaConfig(appDir: string, functionName: string): Record<string, any> | null {
    try {
      const guobaPath = this.getGuobaConfigFilePath(appDir, functionName);
      if (!fs.existsSync(guobaPath)) {
        return null;
      }
      const content = fs.readFileSync(guobaPath, 'utf8');
      return YAML.parse(content);
    } catch (error) {
      logger.error(`[Guoba] 读取配置文件失败 [${appDir}/${functionName}]:`, error);
      return null;
    }
  }

  /**
   * 通用获取配置文件数据方法
   * 优先级：Guoba 配置 > 用户配置 + 默认配置
   * @param typeDir 配置文件目录类型对应路径 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @returns {object} 配置数据
   */
  getConfigData(typeDir: string, appDir: string, functionName: string) {
    // 对于 user config 类型，优先检查 Guoba 配置
    if (typeDir === 'config') {
      const guobaConfig = this.readGuobaConfig(appDir, functionName);
      if (guobaConfig) {
        const key = `guoba_${appDir}_${functionName}`;
        if (this[key]) return this[key];

        this[key] = guobaConfig;
        // 监听 Guoba 配置文件变化
        this.watch(this.getGuobaConfigFilePath(appDir, functionName), 'guoba', appDir, functionName);
        return this[key];
      }
    }

    const configFilePath = this.getConfigFilePath(typeDir, appDir, functionName);
    const key = `${typeDir}_${appDir}_${functionName}`;

    if (this[key]) return this[key];

    this[key] = YAML.parse(fs.readFileSync(configFilePath, 'utf8'));

    this.watch(configFilePath, typeDir, appDir, functionName);

    return this[key];
  }

  /**
   * 获取配置文件路径
   * @param typeDir 配置文件目录类型对应路径 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   * @returns {string} 配置文件路径
   */
  getConfigFilePath(typeDir: string, appDir: string, functionName: string): string {
    if (typeDir === 'defaultConfig') {
      return path.join(_paths.pluginPath, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
    } else {
      return path.join(_paths.botYukiData, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
    }
  }

  /**
   * 监听配置文件的变化
   * @param configFilePath 文件路径
   * @param typeDir 配置文件目录类型 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   */
  watch(configFilePath: string, typeDir: string, appDir: string, functionName: string) {
    const key = `${typeDir}_${appDir}_${functionName}`;

    if (this.watcher[key]) return;

    const watcher = chokidar.watch(configFilePath);
    watcher.on('change', () => {
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
    return this.getConfigData('defaultConfig', appDir, functionName);
  }

  /**
   * 获取用户配置
   * 优先级：Guoba 配置 > (用户配置 + 默认配置)
   * @param appDir 配置app目录
   * @param functionName 配置文件名称，不包含.yaml后缀
   */
  getUserConfig(appDir: string, functionName: string) {
    // 优先检查 Guoba 配置
    const guobaConfig = this.readGuobaConfig(appDir, functionName);
    if (guobaConfig) {
      const defaultConfigData = this.getDefaultConfig(appDir, functionName);
      return lodash.merge({}, defaultConfigData, guobaConfig);
    }

    // 否则使用原有逻辑
    const userConfigData = this.getConfigData('config', appDir, functionName);
    const defaultConfigData = this.getDefaultConfig(appDir, functionName);

    return lodash.merge({}, defaultConfigData, userConfigData);
  }

  /**
   * 保存配置文件
   * @param typeDir 配置文件目录类型 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
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
      fs.writeFileSync(filePath, yamlContent, 'utf8');
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
    this.saveConfig('config', appDir, functionName, config); // 保存更新后的配置
  }

  /** 读取package.json文件，获取指定key的值
   * @param keyName 要获取的key名称
   * @param path package.json文件路径
   */
  getPackageJsonKey(keyName: string, path: string): string | null {
    try {
      const content = fs.readFileSync(path, 'utf-8');
      const packageJson: { [key: string]: any } = JSON.parse(content);
      const match: string | null = packageJson[keyName];

      if (match) {
        return match;
      } else {
        return null;
      }
    } catch (error) {
      logger.error(`getPackageJsonKey error: ${error}`);
      return null;
    }
  }
}

export default new Config();
