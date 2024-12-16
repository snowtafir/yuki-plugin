export declare const pluginName: string;
export declare const _paths: {
    root: string;
    botData: string;
    botYukiData: string;
    botTempPath: string;
    pluginPath: string;
    pluginResources: string;
    pluginName: string;
};
/**
 * 使用import.meta.url得到require
 * @param basePath
 * @returns
 * 这并不是
 * ***
 * import { createRequire } from "module"
 * ***
 * 原型为
 * new URL(path, import.meta.url).href
 */
export declare const createRequire: (basePath: string) => (path: string) => string;
