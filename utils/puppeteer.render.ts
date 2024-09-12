// 该文件是 yuki-plugin 插件的截图类，通过注入 Puppeteer 实例为依赖，拓展了 screenshot 方法，实现了截图的额外功能。
import { Browser } from 'puppeteer';
import { Puppeteer } from 'react-puppeteer';
import fs from 'fs';
import path from 'path';
import { _paths } from '@/utils/paths'

declare const logger: any;

export type ScreenshotOptions = {
  SOptions?: {
    type: 'jpeg' | 'png' | 'webp'
    quality: number
  }
  tab?: string
  timeout?: number
  isSplit?: boolean
  addStyle?: string
  header?: { [key: string]: string }
  pageSplitHeight?: number
  pageWidth?: number
  modelName?: string
  saveHtmlfile?: boolean
}

export class YukiPuppeteerRender {
  private puppeteerInstance: Puppeteer;
  constructor(puppeteerInstance: Puppeteer) {
    this.puppeteerInstance = puppeteerInstance;
  }
  /**
   * 截图并返回buffer
   * @param htmlPath 绝对路径
   * @param tab 截图元素位 默认 body
   * @param type 图片类型，默认png
   * @param quality 清晰度，默认100
   * @param timeout 响应检查，默认120000
   * @param isSplit 是否分割图片 booelan，默认undefined，如果为undefined则截取整个页面为一张图片，如果为true则按照 pageSplitHeight 高度分割全部页面，如果为false则截取页面的第一个默认pageSplitHeight高度的页面
   * @param pageSplitHeight 分割图片高度，默认 8000。
   * @param pageWidth 页面宽度，默认 900
   * @param addStyle 额外的 CSS 样式 示例 '.ql-editor { max-height: 100% !important; overflow-x: hidden; }'
   * @param header 请求头 { [key: string]: string }，示例：{ 'referer': 'https://space.bilibili.com' }
   * @param modelName 调用模块名称，默认yuki-plugin
   * @returns {false | {img: buffer[]}}
   */
  async yukiScreenshot(htmlPath: string, Options?: ScreenshotOptions): Promise<false | { img: Buffer[]; }> {
    if (!(await this.puppeteerInstance.isStart())) return false
    let name = Options?.modelName ?? 'yuki-plugin';
    let pageHeight = Options?.pageSplitHeight ?? 8000; // 分割图片高度，默认 8000

    try {
      const browser = this.puppeteerInstance.browser as Browser;
      const page = await browser?.newPage().catch(err => {
        logger.error(err);
      })
      if (!page) return false

      await page.setViewport({
        width: Options?.pageWidth ?? 900,
        height: 7500
      })

      // 设置请求 Header
      if (Options?.header) {
        await page.setExtraHTTPHeaders(Options.header);
      }

      await page.goto(`file://${htmlPath}`, { timeout: Options?.timeout ?? 120000, waitUntil: ["load", "networkidle0"] });

      const element = await page.$(Options?.tab ?? 'body')
      if (!element) return false

      const boundingBox = await element.boundingBox(); // 获取内容区域的边界框信息
      const num = Options?.isSplit ? Math.ceil(boundingBox.height / pageHeight) : 1; // 根据是否需要分片，计算分片数量，默认为 1
      pageHeight = Math.round(boundingBox.height / num); //动态调整分片高度，防止过短影响观感。

      await page.setViewport({ width: boundingBox.width + 50, height: pageHeight + 100 });

      // 根据 style 的值来修改 CSS 样式
      if (Options?.addStyle) {
        await page.addStyleTag({ content: Options.addStyle, });
      }

      // 禁止 GIF 动图播放
      await page.addStyleTag({ content: `img[src$=".gif"] {animation-play-state: paused !important;}` });

      // 是否保存 html 文件
      if (Options?.saveHtmlfile === true) {
        const htmlContent = await page.content();
        const Dir = path.join(_paths.root, `/temp/html/yuki-plugin/${name}/`);
        if (!fs.existsSync(Dir)) {
          fs.mkdirSync(Dir, { recursive: true });
        }
        fs.writeFileSync(`${Dir}${Date.now()}.html`, htmlContent);
      }

      logger.info('[puppeteer] success')

      let start = Date.now();
      const ret = new Array<Buffer>();

      for (let i = 1; i <= num; i++) {
        if (i > 1) {
          await page.evaluate(pageHeight => { window.scrollBy(0, pageHeight); }, pageHeight); // 在页面上下文中执行滚动操作
          await new Promise((resolve) => setTimeout(resolve, 500)); // 等待一段时间，确保页面加载完成
        }

        let renderOptions = Options?.SOptions ?? { type: 'png' }
        const screenshotOptions = {
          ...renderOptions,
          clip: {
            x: 0,
            y: pageHeight * (i - 1), // 根据分片序号计算截图区域的起始位置
            width: Math.round(boundingBox.width), // 截图区域的宽度与内容区域宽度一致
            height: Math.min(
              pageHeight,
              boundingBox.height - pageHeight * (i - 1)
            ), // 截图区域的高度取决于内容区域剩余的高度或者默认的分片高度
          },
        };

        const buff: string | false | Uint8Array = await element.screenshot(screenshotOptions).catch(err => {
          logger.error('[puppeteer]', 'screenshot', err)
          return false
        }); // 对指定区域进行截图

        if (buff !== false) {
          const imgBuff: Buffer = !Buffer.isBuffer(buff) ? Buffer.from(buff) : buff;
          /** 计算图片大小 */
          const kb = (imgBuff?.length / 1024).toFixed(2) + "kb"; // 计算图片大小

          logger.mark(`[图片生成][${name}][${i}次] ${kb} ${logger.green(`${Date.now() - start}ms`)}`); // 记录日志

          ret.push(imgBuff); // 将截图结果添加到数组中
        } else {
          logger.error(`[puppeteer]`, '截图失败');
        }
      }
      if (ret.length === 0 || !ret[0]) {
        logger.error(`[图片生成][${name}] 图片生成为空`);
        return false;
      }
      // 关闭页面
      await page.close().catch(err => logger.error(err));
      return { img: ret }; // 返回图像数组
    } catch (err) {
      logger.error('[puppeteer] newPage', err)
      return false
    }
  }
}
