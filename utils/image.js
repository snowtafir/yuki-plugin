import React from 'react';
import { Picture } from 'react-puppeteer';
import { YukiPuppeteerRender } from './puppeteer.render.js';
import * as index from '../components/index.js';

class Image extends Picture {
    yukiPuppeteerRender;
    constructor() {
        super();
        this.Com;
        this.Pup.start();
        this.yukiPuppeteerRender = new YukiPuppeteerRender(this.Pup);
    }
    async renderPage(uid, page, props = {}, ScreenshotOptions, ComponentCreateOpsion) {
        const Page = index[page];
        return this.yukiPuppeteerRender.yukiScreenshot(this.Com.compile({
            join_dir: page,
            html_name: `${uid}.html`,
            html_body: React.createElement(Page, { ...props }),
            ...ComponentCreateOpsion
        }), ScreenshotOptions);
    }
}
var Image$1 = new Image();

export { Image, Image$1 as default };
