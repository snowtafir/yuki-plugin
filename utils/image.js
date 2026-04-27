import React from 'react';
import 'puppeteer';
import 'react-dom/server';
import 'fs';
import 'path';
import { Picture } from './package/jsxp/picture.js';
import { YukiPuppeteerRender } from './puppeteer.render.js';
import * as index from '../components/index.js';

/**
 * image.tsx - 图片渲染模块
 * 基于 jsxp 提供的 Picture 类和 YukiPuppeteerRender 实现 React 组件到图片的渲染
 * 支持任务队列管理，确保截图任务按顺序执行
 */
/**
 * Image 类
 * 继承自 Picture 类，整合了 YukiPuppeteerRender 提供增强的截图功能
 */
class Image extends Picture {
    yukiPuppeteerRender;
    constructor() {
        super();
        // 初始化 YukiPuppeteerRender 实例，注入 Puppeteer 实例
        this.yukiPuppeteerRender = new YukiPuppeteerRender(this.puppeteer);
    }
    /**
     * 执行实际的渲染和截图操作
     * @param uid 唯一标识符，用于生成 HTML 文件名
     * @param page 组件名称，对应 components/index 中导出的组件
     * @param props 传入组件的参数
     * @param screenshotOptions 截图选项配置
     * @param componentCreateOption 组件创建选项
     * @returns 失败返回 false，成功返回包含图片 Buffer 数组的对象
     */
    async _renderPage(uid, page, props = {}, screenshotOptions, componentCreateOption) {
        // 根据组件名称获取对应的 React 组件
        const Page = index[page];
        if (!Page) {
            console.error(`[image] 未找到组件: ${page}`);
            return false;
        }
        // 编译 React 组件为 HTML 文件路径
        const htmlPath = this.component.compile({
            path: page,
            name: `${uid}.html`,
            component: React.createElement(Page, { ...props }),
            ...componentCreateOption
        });
        // 调用 yukiPuppeteerRender 进行截图操作
        return this.yukiPuppeteerRender.yukiScreenshot(htmlPath, screenshotOptions);
    }
}
// 单例实例
let instance = null;
const queue = [];
let isProcessing = false;
/**
 * 处理队列中的任务
 * 按顺序逐个执行队列中的渲染任务
 */
const processQueue = async () => {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }
    isProcessing = true;
    const task = queue.shift();
    try {
        const result = await instance._renderPage(task.uid, task.page, task.props, task.screenshotOptions, task.componentCreateOption);
        task.resolve(result);
    }
    catch (error) {
        console.error('[image] 渲染任务失败:', error);
        task.reject(false);
    }
    // 继续处理下一个任务
    processQueue();
};
/**
 * 渲染 React 组件为图片
 * 通过任务队列管理，确保多个渲染请求按顺序执行，避免并发问题
 *
 * @param uid 唯一标识符，用于生成 HTML 文件名
 * @param page 组件名称，对应 components/index 中导出的组件
 * @param props 传入组件的参数
 * @param screenshotOptions 截图选项配置
 * @param componentCreateOption 组件创建选项
 * @returns Promise，失败返回 false，成功返回包含图片 Buffer 数组的对象
 *
 * @example
 * ```typescript
 * const result = await renderPage('user123', 'MainPage', { title: 'Hello' }, {
 *   SOptions: { type: 'png', quality: 100 },
 *   isSplit: true
 * });
 * if (result) {
 *   // result.img 是 Buffer 数组
 * }
 * ```
 */
const renderPage = async (uid, page, props = {}, screenshotOptions, componentCreateOption) => {
    // 懒加载单例实例
    if (!instance) {
        instance = new Image();
    }
    return new Promise((resolve, reject) => {
        queue.push({
            uid,
            page,
            props,
            screenshotOptions,
            componentCreateOption,
            resolve,
            reject
        });
        // 如果没有任务正在处理，则开始处理队列
        if (!isProcessing) {
            processQueue();
        }
    });
};

export { renderPage };
