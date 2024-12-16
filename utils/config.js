import * as fs from 'fs';
import YAML from 'yaml';
import * as chokidar from 'chokidar';
import lodash from 'lodash';
import path from 'path';
import { _paths } from './paths.js';

/**
 * Config 类用于管理配置文件的读取和监听
 */
class Config {
    defaultConfigPath;
    userConfigPath;
    defaultConfig;
    userConfig;
    watcher;
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
     * 通用获取配置文件数据方法
     * @param typeDir 配置文件目录类型对应路径 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     * @returns {object} 配置数据
     */
    getConfigData(typeDir, appDir, functionName) {
        const configFilePath = this.getConfigFilePath(typeDir, appDir, functionName);
        const key = `${typeDir}_${appDir}_${functionName}`;
        if (this[key])
            return this[key];
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
    getConfigFilePath(typeDir, appDir, functionName) {
        if (typeDir === 'defaultConfig') {
            return path.join(_paths.pluginPath, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
        }
        else {
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
    watch(configFilePath, typeDir, appDir, functionName) {
        const key = `${typeDir}_${appDir}_${functionName}`;
        if (this.watcher[key])
            return;
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
    getDefaultConfig(appDir, functionName) {
        return this.getConfigData('defaultConfig', appDir, functionName);
    }
    /**
     * 获取用户配置
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     */
    getUserConfig(appDir, functionName) {
        const userConfigData = this.getConfigData('config', appDir, functionName);
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
    saveConfig(typeDir, appDir, functionName, data) {
        const filePath = this.getConfigFilePath(typeDir, appDir, functionName);
        if (lodash.isEmpty(data)) {
            fs.existsSync(filePath) && fs.unlinkSync(filePath);
        }
        else {
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
    updateConfigItem(appDir, functionName, key, value) {
        const config = this.getUserConfig(appDir, functionName);
        config[key] = value; // 更新配置项
        this.saveConfig('config', appDir, functionName, config); // 保存更新后的配置
    }
    /** 读取package.json文件，获取指定key的值
     * @param keyName 要获取的key名称
     * @param path package.json文件路径
     */
    getPackageJsonKey(keyName, path) {
        try {
            const content = fs.readFileSync(path, 'utf-8');
            const packageJson = JSON.parse(content);
            const match = packageJson[keyName];
            if (match) {
                return match;
            }
            else {
                return null;
            }
        }
        catch (error) {
            logger.error(`getPackageJsonKey error: ${error}`);
            return null;
        }
    }
}
var Config$1 = new Config();

export { Config$1 as default };
