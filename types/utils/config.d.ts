import * as chokidar from 'chokidar';
/**
 * Config 类用于管理配置文件的读取和监听
 */
declare class Config {
    readonly defaultConfigPath: string;
    readonly userConfigPath: string;
    defaultConfig: Record<string, any>;
    userConfig: Record<string, any>;
    watcher: Record<string, chokidar.FSWatcher>;
    constructor();
    /** 操作并创建配置文件到指定目录 */
    initConfigFiles(): void;
    /**
     * 通用获取配置文件数据方法
     * @param typeDir 配置文件目录类型对应路径 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     * @returns {object} 配置数据
     */
    getConfigData(typeDir: string, appDir: string, functionName: string): any;
    /**
     * 获取配置文件路径
     * @param typeDir 配置文件目录类型对应路径 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     * @returns {string} 配置文件路径
     */
    getConfigFilePath(typeDir: string, appDir: string, functionName: string): string;
    /**
     * 监听配置文件的变化
     * @param configFilePath 文件路径
     * @param typeDir 配置文件目录类型 defaultConfig: defaultConfig 或 config: yunzai/data/yuki-plugin/config
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     */
    watch(configFilePath: string, typeDir: string, appDir: string, functionName: string): void;
    /**
     * 获取默认配置
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     */
    getDefaultConfig(appDir: string, functionName: string): any;
    /**
     * 获取用户配置
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     */
    getUserConfig(appDir: string, functionName: string): any;
    /**
     * 保存配置文件
     * @param typeDir 插件为起始的配置文件目录
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     * @param data 配置数据
     */
    saveConfig(typeDir: string, appDir: string, functionName: string, data: any): void;
    /**
     * 更新并保存配置项
     * @param appDir 配置app目录
     * @param functionName 配置文件名称，不包含.yaml后缀
     * @param key 配置项的键
     * @param value 配置项的值
     */
    updateConfigItem(appDir: string, functionName: string, key: string, value: any): void;
    /** 读取package.json文件，获取指定key的值
     * @param keyName 要获取的key名称
     * @param path package.json文件路径
     */
    getPackageJsonKey(keyName: string, path: string): string | null;
}
declare const _default: Config;
export default _default;
