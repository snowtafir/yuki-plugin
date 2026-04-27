import { LaunchOptions, Browser } from 'puppeteer';
import { RenderOptions } from './types.js';
/**
 * 默认参数配置
 */
declare const PuppeteerDefineOptioins: LaunchOptions;
/**
 * 无头浏览器优化配置
 */
declare const PuppeteerOptimizeOptioins: LaunchOptions;
/**
 * 无头浏览器类
 * 提供 Puppeteer 实例的启动、控制和渲染功能
 */
export declare class Puppeteer {
    #private;
    browser: Browser | null;
    /**
     * 构造函数
     * @param launch Puppeteer 启动选项，可选
     */
    constructor(launch?: LaunchOptions);
    /**
     * 设置启动配置
     * @param val 启动配置
     * @returns this
     */
    setLaunch(val: LaunchOptions): this;
    /**
     * 获取启动配置
     * @returns 启动配置
     */
    getLaunch(): LaunchOptions;
    /**
     * 启动 Puppeteer 浏览器
     * @returns 是否启动成功
     */
    start(): Promise<boolean>;
    /**
     * 检查并启动浏览器（带自动重启机制）
     * @returns 是否启动成功
     */
    isStart(): Promise<boolean>;
    /**
     * 渲染 HTML 文件或内容为图片
     * @param html HTML 文件路径或内容
     * @param Options 渲染选项
     * @returns 图片 Buffer 或 null
     */
    render(html: string, Options?: RenderOptions): Promise<Buffer | null>;
    /**
     * 渲染纯 HTML 内容为图片
     * @param htmlContent HTML 内容字符串
     * @param Options 渲染选项
     * @returns 图片 Buffer 或 null
     */
    renderHtml(htmlContent: string, Options?: RenderOptions): Promise<Buffer | null>;
}
export { PuppeteerDefineOptioins, PuppeteerOptimizeOptioins };
/**
 * 类型别名，保持与原始 jsxp 库的 API 兼容
 * @deprecated 请直接使用 LaunchOptions
 */
export type PuppeteerLaunchOptions = LaunchOptions;
export type PuppeteerDefineOptioinsType = LaunchOptions;
export type PuppeteerOptimizeOptioinsType = LaunchOptions;
