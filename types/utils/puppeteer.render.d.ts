import { Puppeteer } from 'jsxp';
export type ScreenshotOptions = {
    SOptions?: {
        type: 'jpeg' | 'png' | 'webp';
        quality: number;
    };
    tab?: string;
    timeout?: number;
    isSplit?: boolean;
    addStyle?: string;
    header?: {
        [key: string]: string;
    };
    pageSplitHeight?: number;
    pageWidth?: number;
    modelName?: string;
    saveHtmlfile?: boolean;
};
export declare class YukiPuppeteerRender {
    private puppeteerInstance;
    constructor(puppeteerInstance: Puppeteer);
    yukiScreenshot(htmlPath: string, Options?: ScreenshotOptions): Promise<false | {
        img: Buffer[];
    }>;
}
