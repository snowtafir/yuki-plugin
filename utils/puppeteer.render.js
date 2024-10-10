import fs__default from 'fs';
import path from 'path';
import { _paths } from './paths.js';

class YukiPuppeteerRender {
    puppeteerInstance;
    constructor(puppeteerInstance) {
        this.puppeteerInstance = puppeteerInstance;
    }
    async yukiScreenshot(htmlPath, Options) {
        if (!(await this.puppeteerInstance.isStart()))
            return false;
        let name = Options?.modelName ?? 'yuki-plugin';
        let pageHeight = Options?.pageSplitHeight ?? 8000;
        try {
            const browser = this.puppeteerInstance.browser;
            const page = await browser?.newPage().catch(err => {
                console.error(err);
            });
            if (!page)
                return false;
            if (Options?.header) {
                await page.setExtraHTTPHeaders(Options.header);
            }
            await page.goto(`file://${htmlPath}`, { timeout: Options?.timeout ?? 120000, waitUntil: ['load', 'networkidle0'] });
            const element = await page.$(Options?.tab ?? 'body');
            if (!element)
                return false;
            if (Options?.addStyle) {
                await page.addStyleTag({ content: Options.addStyle });
            }
            const boundingBox = await element.boundingBox();
            const num = Options?.isSplit ? Math.ceil(boundingBox.height / pageHeight) : 1;
            pageHeight = Math.round(boundingBox.height / num);
            await page.setViewport({ width: boundingBox.width + 50, height: pageHeight + 100 });
            await page.addStyleTag({ content: `img[src$=".gif"] {animation-play-state: paused !important;}` });
            if (Options?.saveHtmlfile === true) {
                const htmlContent = await page.content();
                const Dir = path.join(_paths.root, `/temp/html/yuki-plugin/${name}/`);
                if (!fs__default.existsSync(Dir)) {
                    fs__default.mkdirSync(Dir, { recursive: true });
                }
                fs__default.writeFileSync(`${Dir}${Date.now()}.html`, htmlContent);
            }
            console.info('[puppeteer] success');
            let start = Date.now();
            const ret = new Array();
            for (let i = 1; i <= num; i++) {
                if (i > 1) {
                    await page.evaluate(pageHeight => {
                        window.scrollBy(0, pageHeight);
                    }, pageHeight);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                let renderOptions = Options?.SOptions ?? { type: 'png' };
                const screenshotOptions = {
                    ...renderOptions,
                    clip: {
                        x: 0,
                        y: pageHeight * (i - 1),
                        width: Math.round(boundingBox.width),
                        height: Math.min(pageHeight, boundingBox.height - pageHeight * (i - 1))
                    }
                };
                const buff = await element.screenshot(screenshotOptions).catch(err => {
                    console.error('[puppeteer]', 'screenshot', err);
                    return false;
                });
                if (buff !== false) {
                    const imgBuff = !Buffer.isBuffer(buff) ? Buffer.from(buff) : buff;
                    const kb = (imgBuff?.length / 1024).toFixed(2) + 'kb';
                    console.warn(`[图片生成][${name}][${i}次] ${kb} ${`${Date.now() - start}ms`}`);
                    ret.push(imgBuff);
                }
                else {
                    console.error(`[puppeteer]`, '截图失败');
                }
            }
            if (ret.length === 0 || !ret[0]) {
                console.error(`[图片生成][${name}] 图片生成为空`);
                return false;
            }
            await page.close().catch(err => console.error(err));
            return { img: ret };
        }
        catch (err) {
            console.error('[puppeteer] newPage', err);
            return false;
        }
    }
}

export { YukiPuppeteerRender };
