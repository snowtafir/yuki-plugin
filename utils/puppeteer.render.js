import { Puppeteer } from 'react-puppeteer';
import fs__default from 'fs';
import path from 'path';
import { _paths } from './paths.js';

class YukiPuppeteerRender extends Puppeteer {
    async yukiScreenshot(htmlPath, Options) {
        if (!(await this.isStart()))
            return false;
        let name = Options?.modelName ?? 'yuki-plugin';
        let pageHeight = Options?.pageSplitHeight ?? 8000;
        try {
            const page = await this.browser?.newPage().catch(err => {
                logger.error(err);
            });
            if (!page)
                return false;
            await page.setViewport({
                width: Options?.pageWidth ?? 900,
                height: 7500
            });
            if (Options?.header) {
                await page.setExtraHTTPHeaders(Options.header);
            }
            await page.goto(`file://${htmlPath}`, { timeout: Options?.timeout ?? 120000, waitUntil: ["load", "networkidle0"] });
            const element = await page.$(Options?.tab ?? 'body');
            if (!element)
                return false;
            const boundingBox = await element.boundingBox();
            const num = Options?.isSplit ? Math.ceil(boundingBox.height / pageHeight) : 1;
            pageHeight = Math.round(boundingBox.height / num);
            await page.setViewport({
                width: boundingBox.width + 50,
                height: pageHeight + 100
            });
            if (Options?.addStyle) {
                await page.addStyleTag({
                    content: Options.addStyle,
                });
            }
            await page.addStyleTag({
                content: `img[src$=".gif"] {animation-play-state: paused !important;}`
            });
            if (Options?.saveHtmlfile === true) {
                const htmlContent = await page.content();
                const Dir = path.join(_paths.root, `/temp/html/yuki-plugin/${name}/`);
                if (!fs__default.existsSync(Dir)) {
                    fs__default.mkdirSync(Dir, { recursive: true });
                }
                fs__default.writeFileSync(`${Dir}${Date.now()}.html`, htmlContent);
            }
            logger.info('[puppeteer] success');
            let numSun = 0;
            let start = Date.now();
            const ret = new Array();
            let buff;
            for (let i = 1; i <= num; i++) {
                if (i > 1) {
                    await page.evaluate(pageHeight => {
                        window.scrollBy(0, pageHeight);
                    }, pageHeight);
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
                let renderOptions = Options?.SOptions ?? { type: 'png' };
                const screenshotOptions = {
                    ...renderOptions,
                    clip: {
                        x: 0,
                        y: pageHeight * (i - 1),
                        width: Math.round(boundingBox.width),
                        height: Math.min(pageHeight, boundingBox.height - pageHeight * (i - 1)),
                    },
                };
                buff = await element.screenshot(screenshotOptions).catch(err => {
                    logger.error('[puppeteer]', 'screenshot', err);
                    return false;
                });
                numSun++;
                if (buff !== false) {
                    const kb = (buff?.length / 1024).toFixed(2) + "kb";
                    logger.mark(`[图片生成][${name}][${numSun}次] ${kb} ${logger.green(`${Date.now() - start}ms`)}`);
                    ret.push(buff);
                }
                else {
                    logger.error(`[puppeteer]`, '截图失败');
                }
            }
            if (ret.length === 0 || !ret[0]) {
                logger.error(`[图片生成][${name}] 图片生成为空`);
                return false;
            }
            await page.close().catch(err => logger.error(err));
            return { img: ret };
        }
        catch (err) {
            logger.error('[puppeteer] newPage', err);
            return false;
        }
    }
}

export { YukiPuppeteerRender };
