import React from 'react';
import { Puppeteer, Picture, Component, ComponentCreateOpsionType } from 'react-puppeteer';
import { YukiPuppeteerRender, ScreenshotOptions } from '@/utils/puppeteer.render';
import * as ReactPages from '@/components/index'

// 初始化 组件渲染对象
const com = new Component()

const yukiPuppeteerRender = new YukiPuppeteerRender();

export class Image extends Picture {
  /**
   * 初始化运行Puppeteer
   */
  constructor() {
    // 继承实例
    super()
    // start
    this.Pup = new Puppeteer()
    this.Pup.start()
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
    return yukiPuppeteerRender.yukiScreenshot(
      com.compile({
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
