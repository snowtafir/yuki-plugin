import { LaunchOptions } from 'puppeteer';
import { Component } from './component.js';
import { Puppeteer } from './puppeteer.js';
import { ComponentCreateOpsionType, RenderOptions } from './types.js';
/**
 * 截图类
 * 结合了组件编译和浏览器渲染功能
 */
export declare class Picture {
    /**
     * 浏览器控制实例
     */
    puppeteer: Puppeteer;
    /**
     * 组件控制实例
     */
    component: Component;
    /**
     * 初始化组件和浏览器
     * @param launch Puppeteer 启动选项，可选
     */
    constructor(launch?: LaunchOptions);
    /**
     * 截图组件
     * @param options 组件选项
     * @param renderOptions 渲染选项
     * @returns 截图 Buffer 或 HTML 地址（当 create 为 false 时）
     */
    screenshot(options: ComponentCreateOpsionType, renderOptions?: RenderOptions): Promise<string | Buffer | null>;
    /**
     * 纯 HTML 模式截图
     * @param htmlContent HTML 内容字符串
     * @param renderOptions 渲染选项
     * @returns 截图 Buffer 或 null
     */
    screenshotHtml(htmlContent: string, renderOptions?: RenderOptions): Promise<Buffer | null>;
}
