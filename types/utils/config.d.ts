import chokidar from 'chokidar';
declare class Config {
    readonly defaultConfigPath: string;
    readonly userConfigPath: string;
    defaultConfig: Record<string, any>;
    userConfig: Record<string, any>;
    watcher: Record<string, chokidar.FSWatcher>;
    constructor();
    initConfigFiles(): void;
    getConfigData(typeDir: string, appDir: string, functionName: string): any;
    getConfigFilePath(typeDir: string, appDir: string, functionName: string): string;
    watch(configFilePath: string, typeDir: string, appDir: string, functionName: string): void;
    getDefaultConfig(appDir: string, functionName: string): any;
    getUserConfig(appDir: string, functionName: string): any;
    saveConfig(typeDir: string, appDir: string, functionName: string, data: any): void;
    updateConfigItem(appDir: string, functionName: string, key: string, value: any): void;
    getPackageJsonKey(keyName: string, path: string): string | null;
}
declare const _default: Config;
export default _default;
