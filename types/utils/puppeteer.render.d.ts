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
    yukiScreenshot(htmlPath: string, Options?: ScreenshotOptions): Promise<false | {
        img: Buffer[];
    }>;
}
