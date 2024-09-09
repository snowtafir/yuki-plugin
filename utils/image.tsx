import React from 'react';
import { Picture, ComponentCreateOpsionType } from 'react-puppeteer';
import { YukiPuppeteerRender, ScreenshotOptions } from '@/utils/puppeteer.render';
import * as ReactPages from '@/components/index'

export class Image extends Picture {
  private yukiPuppeteerRender: YukiPuppeteerRender;
  /**
   * 整合截图方法
   */
  constructor() {
    // 继承实例
    super()
    // 组件渲染对象
    this.Com;
    // start puppeteer
    this.Pup.start();
    this.yukiPuppeteerRender = new YukiPuppeteerRender(this.Pup);
  }

  /**
 * @param uid 唯一标识符
 * @param page 组件名称
 * @param props 传入的组件参数
 * @param ComponentCreateOpsion 组件创建选项
 * @param ScreenshotOptions 截图选项
 * @returns {false | {img: buffer[]}}
 */
  async renderPage<T = any>(
    uid: number | string,
    page: string,
    props: T = {} as T,
    ScreenshotOptions?: ScreenshotOptions,
    ComponentCreateOpsion?: ComponentCreateOpsionType,
  ): Promise<false | { img: Buffer[]; }> {
    const Page = ReactPages[page]
    return this.yukiPuppeteerRender.yukiScreenshot(
      this.Com.compile({
        join_dir: page,
        html_name: `${uid}.html`,
        html_body: <Page {...props} />,
        ...ComponentCreateOpsion
      }),
      ScreenshotOptions,
    )
  }
}
// 初始化 图片生成对象
export default new Image();
