import * as fs from 'fs';
import YAML from 'yaml';
import chokidar from 'chokidar';
import lodash from 'lodash';
import path from 'path';
import { _paths } from './paths.js';

class Config {
    packageJsonPath;
    defaultConfigPath;
    userConfigPath;
    defaultConfig;
    userConfig;
    watcher;
    constructor() {
        this.packageJsonPath = path.join(_paths.pluginPath, 'package.json');
        this.defaultConfigPath = path.join(_paths.pluginPath, 'defaultConfig');
        this.defaultConfig = {};
        this.userConfigPath = path.join(_paths.pluginPath, 'config');
        this.userConfig = {};
        this.watcher = {};
        this.initConfigFiles();
    }
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
    getConfigData(typeDir, appDir, functionName) {
        const configFilePath = this.getConfigFilePath(typeDir, appDir, functionName);
        const key = `${typeDir}_${appDir}_${functionName}`;
        if (this[key])
            return this[key];
        this[key] = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
        this.watch(configFilePath, typeDir, appDir, functionName);
        return this[key];
    }
    getConfigFilePath(typeDir, appDir, functionName) {
        if (typeDir === "defaultConfig") {
            return path.join(_paths.pluginPath, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
        }
        else {
            return path.join(_paths.botYukiData, `${typeDir}`, `${appDir}`, `${functionName}.yaml`);
        }
    }
    watch(configFilePath, typeDir, appDir, functionName) {
        const key = `${typeDir}_${appDir}_${functionName}`;
        if (this.watcher[key])
            return;
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
    getDefaultConfig(appDir, functionName) {
        return this.getConfigData("defaultConfig", appDir, functionName);
    }
    getUserConfig(appDir, functionName) {
        const userConfigData = this.getConfigData("config", appDir, functionName);
        const defaultConfigData = this.getDefaultConfig(appDir, functionName);
        return lodash.merge({}, defaultConfigData, userConfigData);
    }
    saveConfig(typeDir, appDir, functionName, data) {
        const filePath = this.getConfigFilePath(typeDir, appDir, functionName);
        if (lodash.isEmpty(data)) {
            fs.existsSync(filePath) && fs.unlinkSync(filePath);
        }
        else {
            const yamlContent = YAML.stringify(data);
            fs.writeFileSync(filePath, yamlContent, "utf8");
        }
    }
    updateConfigItem(appDir, functionName, key, value) {
        const config = this.getUserConfig(appDir, functionName);
        config[key] = value;
        this.saveConfig("config", appDir, functionName, config);
    }
    getLatestVersion() {
        const content = fs.readFileSync(this.packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        const match = packageJson.version;
        if (match) {
            return match;
        }
        else {
            return null;
        }
    }
}
var Config$1 = new Config();

export { Config$1 as default };
