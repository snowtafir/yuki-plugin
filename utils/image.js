import React from 'react';
import { Component, Picture, Puppeteer } from 'react-puppeteer';
import { YukiPuppeteerRender } from './puppeteer.render.js';
import * as index from '../components/index.js';

const com = new Component();
const yukiPuppeteerRender = new YukiPuppeteerRender();
class Image extends Picture {
    constructor() {
        super();
        this.Pup = new Puppeteer();
        this.Pup.start();
    }
    async renderPage(uid, page, props = {}, ScreenshotOptions, ComponentCreateOpsion) {
        const Page = index[page];
        return yukiPuppeteerRender.yukiScreenshot(com.compile({
            join_dir: page,
            html_name: `${uid}.html`,
            html_body: React.createElement(Page, { ...props }),
            ...ComponentCreateOpsion
        }), ScreenshotOptions);
    }
}
var Image$1 = new Image();

export { Image, Image$1 as default };
