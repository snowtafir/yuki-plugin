import puppeteer, { LaunchOptions, Browser } from 'puppeteer';
import type { Page } from 'puppeteer';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { _paths } from '@/utils/paths';
import { RenderOptions } from './types';

/**
 * 默认参数配置
 */
const PuppeteerDefineOptioins: LaunchOptions = {
  // 禁用超时
  timeout: 0,
  // 请求头
  headless: true,
  //
  args: ['--disable-gpu', '--disable-setuid-sandbox', '--no-first-run', '--no-sandbox', '--no-zygote']
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
  // 是否复用宿主浏览器
  #usingHostBrowser = false;
  // 宿主 Puppeteer 渲染器
  #hostRenderer: any = null;
  // 截图租约序号
  #leaseSeq = 0;
  // 宿主租约异常是否已告警
  #hostLeaseWarned = false;
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
        ...this.#launch,
        ...launch
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
   * 优先复用 TRSS-Yunzai 已加载的 Puppeteer 渲染器
   * @returns true 表示已成功复用宿主浏览器
   */
  private async useHostBrowser(): Promise<boolean> {
    let renderer: any;
    try {
      const loaderPath = pathToFileURL(path.join(_paths.root, 'lib', 'renderer', 'loader.js')).href;
      const loader = await import(loaderPath);
      renderer = loader.default?.getRenderer?.('puppeteer');
    } catch (err) {
      console.warn('[puppeteer] 宿主渲染器加载失败，回退本地', err);
      return false;
    }

    if (renderer?.id !== 'puppeteer' || typeof renderer.browserInit !== 'function') {
      console.warn('[puppeteer] 宿主渲染器接口不兼容，回退本地');
      return false;
    }

    this.#hostRenderer = renderer;
    try {
      const browser = await renderer.browserInit();
      if (!browser || !browser.isConnected()) {
        throw new Error('宿主 Chromium 未连接');
      }
      this.browser = browser as Browser;
      this.#usingHostBrowser = true;
      this.#isBrowser = true;
      console.info('[puppeteer] 复用宿主 Chromium');
    } catch (err) {
      this.browser = null;
      this.#isBrowser = false;
      console.error('[puppeteer] 宿主 Chromium 初始化失败', err);
      return false;
    }

    return true;
  }

  /**
   * 启动插件本地 Chromium
   */
  private async startLocalBrowser(): Promise<boolean> {
    this.#usingHostBrowser = false;
    this.#hostRenderer = null;
    this.browser = null;
    this.#isBrowser = false;

    try {
      this.browser = await puppeteer.launch(this.#launch);
      this.#isBrowser = true;
      console.info('[puppeteer] 使用插件本地 Chromium');
      return true;
    } catch (err) {
      console.error('[puppeteer] 本地 Chromium 启动失败', err);
      return false;
    }
  }

  /**
   * 启动 Puppeteer 浏览器
   * @returns 是否启动成功
   */
  async start(): Promise<boolean> {
    this.#usingHostBrowser = false;
    this.#hostRenderer = null;
    if (await this.useHostBrowser()) {
      return true;
    }

    return this.startLocalBrowser();
  }

  /**
   * 检查并启动浏览器（带自动重启机制）
   * @returns 是否启动成功
   */
  async isStart(): Promise<boolean> {
    if (!this.#isBrowser || !this.browser?.isConnected()) {
      this.#isBrowser = false;
      if (!(await this.start())) return false;
    }

    // 宿主浏览器由宿主的截图计数和断线监听负责重启
    if (this.#usingHostBrowser) return true;

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
   * 在浏览器租约内执行任务，协调宿主渲染器重启
   */
  async withBrowserLease<T>(task: (browser: Browser) => Promise<T>, modelName = 'yuki-plugin'): Promise<T> {
    if (!(await this.isStart()) || !this.browser) {
      throw new Error('[puppeteer] 浏览器未启动');
    }

    const renderer = this.#hostRenderer;
    if (!this.#usingHostBrowser || !renderer) {
      return task(this.browser);
    }

    const maxAttempts = 2;
    let lastHostError: unknown;
    let waitForHostRestart = false;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let browser: Browser | null = null;
      let lease: string | null = null;
      let taskStarted = false;

      try {
        if (attempt > 1 && waitForHostRestart && !renderer.browser?.isConnected?.()) {
          // 宿主强制重启会先清空 browser，等待其完成可避免并发启动第二个 Chromium。
          const deadline = Date.now() + 30_000;
          while (Date.now() < deadline && !renderer.browser?.isConnected?.()) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        browser = (await renderer.browserInit()) as Browser | null;
        if (!browser || !browser.isConnected()) {
          throw new Error('[puppeteer] 宿主 Chromium 未连接');
        }

        try {
          if (Array.isArray(renderer.shoting)) {
            lease = `yuki-plugin:${modelName}:${Date.now()}:${++this.#leaseSeq}`;
            renderer.shoting.push(lease);
            this.#hostLeaseWarned = false;
          } else if (!this.#hostLeaseWarned) {
            this.#hostLeaseWarned = true;
            console.warn(`[puppeteer] 宿主不支持截图租约，继续复用 [${modelName}]`);
          }
        } catch (err) {
          lease = null;
          if (!this.#hostLeaseWarned) {
            this.#hostLeaseWarned = true;
            console.warn(`[puppeteer] 宿主租约注册失败，继续复用 [${modelName}]`, err);
          }
        }

        if (renderer.browser !== browser || !browser.isConnected()) {
          throw new Error('[puppeteer] 宿主 Chromium 实例已变更');
        }

        this.browser = browser;
        this.#isBrowser = true;
        taskStarted = true;
        return await task(browser);
      } catch (err) {
        if (taskStarted && !this.isBrowserLifecycleError(err, browser, renderer)) {
          throw err;
        }

        lastHostError = err;
        this.browser = null;
        this.#isBrowser = false;
        waitForHostRestart = taskStarted;

        if (attempt < maxAttempts) {
          console.warn(`[puppeteer] 宿主 Chromium 异常，重试 [${modelName}]`, err);
        } else {
          console.warn(`[puppeteer] 宿主 Chromium 重试失败，回退本地 [${modelName}]`, err);
        }
      } finally {
        if (lease) {
          try {
            const shoting = renderer.shoting;
            if (Array.isArray(shoting)) {
              const index = shoting.indexOf(lease);
              if (index !== -1) {
                shoting.splice(index, 1);
              }
            }
          } catch (err) {
            if (!this.#hostLeaseWarned) {
              this.#hostLeaseWarned = true;
              console.warn(`[puppeteer] 宿主租约释放失败 [${modelName}]`, err);
            }
          }
        }
      }
    }

    if ((await this.startLocalBrowser()) && this.browser) {
      return task(this.browser);
    }

    throw lastHostError ?? new Error(`[puppeteer] 宿主 Chromium 与本地 Chromium 均不可用 [${modelName}]`);
  }

  /**
   * 判断错误是否由宿主浏览器重启导致
   */
  private isBrowserLifecycleError(error: unknown, browser: Browser | null, renderer: any): boolean {
    try {
      if (browser && (!browser.isConnected() || renderer.browser !== browser)) {
        return true;
      }

      return /Target closed|Target close|Protocol error|Session closed|Execution context was destroyed|Page closed|browser has disconnected|Connection closed|frame was detached|宿主 Chromium 未连接|宿主 Chromium 实例已变更/i.test(
        String(error)
      );
    } catch {
      return true;
    }
  }

  /**
   * 渲染 HTML 文件或内容为图片
   * @param html HTML 文件路径或内容
   * @param Options 渲染选项
   * @returns 图片 Buffer 或 null
   */
  async render(html: string, Options?: RenderOptions): Promise<Buffer | null> {
    const { goto, selector, screenshot, isHtmlContent, bufferFromEncoding } = Options ?? {};

    try {
      return await this.withBrowserLease(async browser => {
        let page: Page | null = null;

        try {
          page = await browser.newPage();

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
        } finally {
          await page?.close().catch(() => {});
        }
      });
    } catch (error) {
      console.error('[puppeteer] render error', error);
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
