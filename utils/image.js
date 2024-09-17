import React from 'react';
import { Picture } from 'react-puppeteer';
import { YukiPuppeteerRender } from './puppeteer.render.js';
import * as index from '../components/index.js';

class Image extends Picture {
    yukiPuppeteerRender;
    constructor() {
        super();
        this.yukiPuppeteerRender = new YukiPuppeteerRender(this.Pup);
    }
    async _renderPage(uid, page, props = {}, ScreenshotOptions, ComponentCreateOpsion) {
        const Page = index[page];
        return this.yukiPuppeteerRender.yukiScreenshot(this.Com.compile({
            join_dir: page,
            html_name: `${uid}.html`,
            html_body: React.createElement(Page, { ...props }),
            ...ComponentCreateOpsion
        }), ScreenshotOptions);
    }
}
let instance = null;
const queue = [];
let isProcessing = false;
const processQueue = async () => {
    if (queue.length === 0) {
        isProcessing = false;
        return;
    }
    isProcessing = true;
    const { uid, page, props, ScreenshotOptions, ComponentCreateOpsion, resolve, reject } = queue.shift();
    try {
        const img = await instance._renderPage(uid, page, props, ScreenshotOptions, ComponentCreateOpsion);
        resolve(img);
    }
    catch (error) {
        console.error(error);
        reject(false);
    }
    processQueue();
};
const renderPage = async (uid, page, props = {}, ScreenshotOptions, ComponentCreateOpsion) => {
    if (!instance) {
        instance = new Image();
    }
    return new Promise((resolve, reject) => {
        queue.push({ uid, page, props, ScreenshotOptions, ComponentCreateOpsion, resolve, reject });
        if (!isProcessing) {
            processQueue();
        }
    });
};

export { renderPage };
