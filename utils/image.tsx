import React from 'react';
import { Picture, ComponentCreateOpsionType } from 'jsxp';
import { YukiPuppeteerRender, ScreenshotOptions } from '@/utils/puppeteer.render';
import * as ReactPages from '@/components/index';

// 定义 Image 类，继承自 Picture 类
class Image extends Picture {
  // 私有属性，用于存储 YukiPuppeteerRender 实例
  private yukiPuppeteerRender: YukiPuppeteerRender;

  /**
   * 构造函数，整合截图方法
   * @param launchOptions Puppeteer 启动选项，可选。父类有默认的设置。
   */
  constructor() {
    // 继承父类实例
    super();
    // 父类已经实例化组件渲染对象
    //this.Com;
    // 父类已经实例化启动 Puppeteer
    //this.Pup.start();
    // 初始化 YukiPuppeteerRender 实例
    this.yukiPuppeteerRender = new YukiPuppeteerRender(this.Pup);
  }

  /**
   * 实例方法，用于执行实际的渲染和截图操作
   * @param uid 唯一标识符
   * @param page 组件名称
   * @param props 传入的组件参数
   * @param ComponentCreateOpsion 组件创建选项
   * @param ScreenshotOptions 截图选项
   * @returns {false | {img: buffer[]}}
   */
  async _renderPage<T = any>(
    uid: number | string,
    page: string,
    props: T = {} as T,
    ScreenshotOptions?: ScreenshotOptions,
    ComponentCreateOpsion?: ComponentCreateOpsionType
  ): Promise<false | { img: Buffer[] }> {
    // 根据组件名称获取对应的 React 组件
    const Page = ReactPages[page];
    // 调用 yukiPuppeteerRender 进行截图操作
    return this.yukiPuppeteerRender.yukiScreenshot(
      this.Com.compile({
        path: page,
        name: `${uid}.html`,
        component: <Page {...props} />,
        ...ComponentCreateOpsion
      }),
      ScreenshotOptions
    );
  }
}

// 存储单例实例
let instance: Image = null;

// 存储任务队列
const queue: Array<{
  uid: number | string;
  page: string;
  props: any;
  ScreenshotOptions?: ScreenshotOptions;
  ComponentCreateOpsion?: ComponentCreateOpsionType;
  resolve: (value: false | { img: Buffer[] }) => void;
  reject: (reason?: any) => void;
}> = [];

// 标记当前是否有任务正在处理
let isProcessing = false;

/**
 * 处理队列中的任务
 */
const processQueue = async () => {
  // 如果队列为空，设置 isProcessing 为 false 并返回
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  // 设置 isProcessing 为 true，表示有任务正在处理
  isProcessing = true;
  // 从队列中取出第一个任务
  const { uid, page, props, ScreenshotOptions, ComponentCreateOpsion, resolve, reject } = queue.shift()!;

  try {
    // 调用实例方法 renderPage 执行任务
    const img = await instance._renderPage(uid, page, props, ScreenshotOptions, ComponentCreateOpsion);
    // 任务成功完成，调用 resolve 回调函数
    resolve(img);
  } catch (error) {
    // 任务失败，打印错误信息并调用 reject 回调函数
    console.error(error);
    reject(false);
  }

  // 处理下一个任务
  processQueue();
};

/**
 * 渲染列队中的任务
 * @param uid 唯一标识符
 * @param page 组件名称
 * @param props 传入的组件参数
 * @param ComponentCreateOpsion 组件创建选项
 * @param ScreenshotOptions 截图选项
 * @returns {false | {img: buffer[]}}
 */
const renderPage = async <T = any,>(
  uid: number | string,
  page: string,
  props: T = {} as T,
  ScreenshotOptions?: ScreenshotOptions,
  ComponentCreateOpsion?: ComponentCreateOpsionType
): Promise<false | { img: Buffer[] }> => {
  if (!instance) {
    instance = new Image();
  }
  return new Promise((resolve, reject) => {
    // 将任务添加到队列中
    queue.push({ uid, page, props, ScreenshotOptions, ComponentCreateOpsion, resolve, reject });
    // 如果没有任务正在处理，则开始处理队列
    if (!isProcessing) {
      processQueue();
    }
  });
};

// 导出 renderPage 方法，用于生成图片
export { renderPage };
