import { LaunchOptions } from 'puppeteer';
import { Component } from './component.js';
import { Puppeteer } from './puppeteer.js';
import { ComponentCreateOpsionType, RenderOptions } from './types.js';

/**
 * 截图类
 * 结合了组件编译和浏览器渲染功能
 */
export class Picture {
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
  constructor(launch?: LaunchOptions) {
    this.component = new Component();
    this.puppeteer = new Puppeteer(launch);
  }

  /**
   * 截图组件
   * @param options 组件选项
   * @param renderOptions 渲染选项
   * @returns 截图 Buffer 或 HTML 地址（当 create 为 false 时）
   */
  async screenshot(options: ComponentCreateOpsionType, renderOptions?: RenderOptions): Promise<string | Buffer | null> {
    const address = this.component.compile(options);

    // create 为 false 时返回 HTML 字符串或路径
    if (typeof options.create === 'boolean' && options.create === false) {
      return address;
    }

    return await this.puppeteer.render(address, renderOptions);
  }

  /**
   * 纯 HTML 模式截图
   * @param htmlContent HTML 内容字符串
   * @param renderOptions 渲染选项
   * @returns 截图 Buffer 或 null
   */
  async screenshotHtml(htmlContent: string, renderOptions?: RenderOptions): Promise<Buffer | null> {
    return await this.puppeteer.renderHtml(htmlContent, renderOptions);
  }
}
