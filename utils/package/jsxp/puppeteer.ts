import puppeteer, { LaunchOptions, Browser } from 'puppeteer';
import { RenderOptions } from './types.js';

/**
 * 默认参数配置
 */
const PuppeteerDefineOptioins: LaunchOptions = {
  // 禁用超时
  timeout: 0,
  // 请求头
  headless: true,
  //
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-first-run', '--no-sandbox', '--no-zygote', '--single-process']
};

/**
 * 无头浏览器优化配置
 */
const PuppeteerOptimizeOptioins: LaunchOptions = {
  timeout: 0,
  headless: true,
  args: [
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--safebrowsing-disable-auto-update',
    '--enable-automation',
    '--password-store=basic',
    '--use-mock-keychain'
  ]
};

/**
 * 无头浏览器类
 * 提供 Puppeteer 实例的启动、控制和渲染功能
 */
export class Puppeteer {
  // 截图次数记录
  #pic = 0;
  // 重启次数控制
  #restart = 200;
  // 状态
  #isBrowser = false;
  // 配置
  #launch: LaunchOptions = { ...PuppeteerDefineOptioins };
  // 浏览器实例
  browser: Browser | null = null;

  /**
   * 构造函数
   * @param launch Puppeteer 启动选项，可选
   */
  constructor(launch?: LaunchOptions) {
    if (launch) {
      this.#launch = {
        ...launch,
        ...this.#launch
      };
    }
  }

  /**
   * 设置启动配置
   * @param val 启动配置
   * @returns this
   */
  setLaunch(val: LaunchOptions): this {
    this.#launch = val;
    return this;
  }

  /**
   * 获取启动配置
   * @returns 启动配置
   */
  getLaunch(): LaunchOptions {
    return this.#launch;
  }

  /**
   * 启动 Puppeteer 浏览器
   * @returns 是否启动成功
   */
  async start(): Promise<boolean> {
    try {
      this.browser = await puppeteer.launch(this.#launch);
      this.#isBrowser = true;
      return true;
    } catch (err) {
      this.#isBrowser = false;
      console.error('[puppeteer] err', err);
      return false;
    }
  }

  /**
   * 检查并启动浏览器（带自动重启机制）
   * @returns 是否启动成功
   */
  async isStart(): Promise<boolean> {
    // 检测是否开启
    if (!this.#isBrowser) {
      const T = await this.start();
      if (!T) return false;
    }

    if (this.#pic <= this.#restart) {
      // 记录次数
      this.#pic++;
    } else {
      // 重置次数并重启浏览器
      this.#pic = 0;
      console.info('[puppeteer] close');
      this.#isBrowser = false;
      await this.browser?.close().catch(err => {
        console.error('[puppeteer] close', err);
      });
      console.info('[puppeteer] reopen');
      if (!(await this.start())) return false;
      this.#pic++;
    }

    return true;
  }

  /**
   * 渲染 HTML 文件或内容为图片
   * @param html HTML 文件路径或内容
   * @param Options 渲染选项
   * @returns 图片 Buffer 或 null
   */
  async render(html: string, Options?: RenderOptions): Promise<Buffer | null> {
    const T = await this.isStart();
    if (!T) return null;

    const page = await this.browser?.newPage();
    if (!page) return null;

    const { goto, selector, screenshot, isHtmlContent, bufferFromEncoding } = Options ?? {};

    try {
      if (isHtmlContent) {
        await page.setContent(html, {
          waitUntil: 'networkidle2',
          timeout: 12000,
          ...(goto ?? {})
        });
      } else {
        await page.goto(`file://${html}`, {
          waitUntil: 'networkidle2',
          timeout: 12000,
          ...(goto ?? {})
        });
      }

      const body = await page.$(selector ?? 'body');
      if (!body) return null;

      console.info('[puppeteer] success');

      const buff = (await body.screenshot({
        type: 'png',
        ...(screenshot ?? {})
      })) as Buffer | string | Uint8Array | null;

      await page.close();

      if (!buff) return null;

      // 处理不同类型的返回数据
      if (Buffer.isBuffer(buff)) {
        return buff;
      } else if (buff instanceof Uint8Array) {
        return Buffer.from(buff);
      } else if (typeof buff === 'string') {
        // base64
        if (buff.startsWith('data:')) {
          const base64Data = buff.split(',')[1] || '';
          return Buffer.from(base64Data, 'base64');
        }
        return Buffer.from(buff, bufferFromEncoding ?? 'utf-8');
      }

      return null;
    } catch (error) {
      console.error('[puppeteer] render error', error);
      await page.close().catch(() => {});
      return null;
    }
  }

  /**
   * 渲染纯 HTML 内容为图片
   * @param htmlContent HTML 内容字符串
   * @param Options 渲染选项
   * @returns 图片 Buffer 或 null
   */
  renderHtml(htmlContent: string, Options?: RenderOptions): Promise<Buffer | null> {
    return this.render(htmlContent, { ...Options, isHtmlContent: true });
  }
}

export { PuppeteerDefineOptioins, PuppeteerOptimizeOptioins };

/**
 * 类型别名，保持与原始 jsxp 库的 API 兼容
 * @deprecated 请直接使用 LaunchOptions
 */
export type PuppeteerLaunchOptions = LaunchOptions;
export type PuppeteerDefineOptioinsType = LaunchOptions;
export type PuppeteerOptimizeOptioinsType = LaunchOptions;
