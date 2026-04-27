import fs__default from 'fs';
import path__default from 'path';
import { _paths } from './paths.js';

/**
 * YukiPuppeteerRender 类
 * 提供增强的截图功能，包括分片截图、样式注入、GIF 控制等
 */
class YukiPuppeteerRender {
    puppeteerInstance;
    constructor(puppeteerInstance) {
        this.puppeteerInstance = puppeteerInstance;
    }
    /**
     * 执行截图操作并返回图片 Buffer 数组
     * @param htmlPath HTML 文件的绝对路径
     * @param Options 截图选项配置
     * @returns 失败返回 false，成功返回包含图片 Buffer 数组的对象
     */
    async yukiScreenshot(htmlPath, Options) {
        // 检查浏览器是否启动
        if (!(await this.puppeteerInstance.isStart())) {
            return false;
        }
        const modelName = Options?.modelName ?? 'yuki-plugin';
        const defaultPageHeight = Options?.pageSplitHeight ?? 8000;
        try {
            const browser = this.puppeteerInstance.browser;
            if (!browser)
                return false;
            const page = await browser.newPage().catch(err => {
                console.error('[puppeteer] newPage error:', err);
                return null;
            });
            if (!page)
                return false;
            // 设置请求 Header
            if (Options?.header) {
                await page.setExtraHTTPHeaders(Options.header);
            }
            // 导航到 HTML 文件
            await page.goto(`file://${htmlPath}`, {
                timeout: Options?.timeout ?? 120000,
                waitUntil: ['load', 'networkidle0']
            });
            // 获取目标元素
            const element = await page.$(Options?.tab ?? 'body');
            if (!element) {
                await page.close().catch(() => { });
                return false;
            }
            // 注入额外的 CSS 样式
            if (Options?.addStyle) {
                await page.addStyleTag({ content: Options.addStyle });
            }
            // 获取内容区域的边界框信息
            const boundingBox = await element.boundingBox();
            if (!boundingBox) {
                await page.close().catch(() => { });
                return false;
            }
            // 计算分片数量
            const num = Options?.isSplit ? Math.ceil(boundingBox.height / defaultPageHeight) : 1;
            // 动态调整分片高度，防止过短影响观感
            const adjustedPageHeight = Math.round(boundingBox.height / num);
            // 设置视口大小
            await page.setViewport({
                width: boundingBox.width + 50,
                height: adjustedPageHeight + 100
            });
            // 禁止 GIF 动图播放
            if (Options?.isPauseGif === true) {
                await page.addStyleTag({
                    content: `img[src$=".gif"] {animation-play-state: paused !important;}`
                });
            }
            // 保存 HTML 文件（调试用）
            if (Options?.saveHtmlfile === true) {
                const htmlContent = await page.content();
                const dir = path__default.join(_paths.root, `/temp/html/yuki-plugin/${modelName}/`);
                if (!fs__default.existsSync(dir)) {
                    fs__default.mkdirSync(dir, { recursive: true });
                }
                fs__default.writeFileSync(`${dir}${Date.now()}.html`, htmlContent);
            }
            console.info('[puppeteer] success');
            const startTime = Date.now();
            const resultBuffers = [];
            // 分片截图循环
            for (let i = 1; i <= num; i++) {
                // 滚动页面（除第一片外）
                if (i > 1) {
                    await page.evaluate(pageHeight => {
                        window.scrollBy(0, pageHeight);
                    }, adjustedPageHeight);
                    // 等待页面加载完成
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                // 构建截图选项
                const renderOptions = Options?.SOptions ?? { type: 'png' };
                const screenshotOptions = {
                    ...renderOptions,
                    clip: {
                        x: 0,
                        y: adjustedPageHeight * (i - 1),
                        width: Math.round(boundingBox.width),
                        height: Math.min(adjustedPageHeight, boundingBox.height - adjustedPageHeight * (i - 1))
                    }
                };
                // 执行截图
                const buff = (await element.screenshot(screenshotOptions).catch(err => {
                    console.error('[puppeteer] screenshot error:', err);
                    return false;
                }));
                if (buff !== false && buff) {
                    const imgBuff = !Buffer.isBuffer(buff) ? Buffer.from(buff) : buff;
                    const kb = (imgBuff.length / 1024).toFixed(2) + 'kb';
                    const elapsed = `${Date.now() - startTime}ms`;
                    console.warn(`[图片生成][${modelName}][${i}次] ${kb} ${elapsed}`);
                    resultBuffers.push(imgBuff);
                }
                else {
                    console.error(`[puppeteer] 截图失败 [${modelName}][${i}次]`);
                }
            }
            // 关闭页面
            await page.close().catch(err => console.error('[puppeteer] close page error:', err));
            // 验证结果
            if (resultBuffers.length === 0 || !resultBuffers[0]) {
                console.error(`[图片生成][${modelName}] 图片生成为空`);
                return false;
            }
            return { img: resultBuffers };
        }
        catch (err) {
            console.error('[puppeteer] yukiScreenshot error:', err);
            return false;
        }
    }
}

export { YukiPuppeteerRender };
