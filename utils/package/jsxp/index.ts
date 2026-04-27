/**
 * jsxp 模块 - 提取自 jsxp库 v1.2.3 的核心功能，项目仓库 @ningmengchongshui（柠檬冲水）：https://github.com/lemonade-lab/lvyjs/tree/main/packages/jsxp
 * 提供 React 组件渲染、Puppeteer 浏览器控制和截图功能
 */

// 类型导出
export type { ComponentCreateOpsionType, JSXPOptions, ObtainProps, RenderOptions, RendersType } from './types.js';

// Puppeteer 相关导出
export { Puppeteer, PuppeteerDefineOptioins, PuppeteerOptimizeOptioins } from './puppeteer.js';

// Component 相关导出
export { Component } from './component.js';

// Picture 相关导出
export { Picture } from './picture.js';
