/**
 * YukiPuppeteerRender - 增强的截图渲染类
 * 基于 jsxp 的 Puppeteer 实例，提供分片截图、样式注入等高级功能
 */
import { Puppeteer } from '@/utils/package/jsxp';
/**
 * 截图选项配置
 */
export type ScreenshotOptions = {
    /**
     * 截图格式选项
     */
    SOptions?: {
        type: 'jpeg' | 'png' | 'webp';
        quality: number;
    };
    /**
     * 截图元素选择器，默认 body
     */
    tab?: string;
    /**
     * 页面加载超时时间，默认 120000ms
     */
    timeout?: number;
    /**
     * 是否分片截图
     * - undefined: 截取整个页面为一张图片
     * - true: 按照 pageSplitHeight 高度分割全部页面
     * - false: 截取页面的第一个 pageSplitHeight 高度的页面
     */
    isSplit?: boolean;
    /**
     * 额外的 CSS 样式
     * 示例: '.ql-editor { max-height: 100% !important; overflow-x: hidden; }'
     */
    addStyle?: string;
    /**
     * 请求头配置
     * 示例: { 'referer': 'https://space.bilibili.com' }
     */
    header?: {
        [key: string]: string;
    };
    /**
     * 分片截图时每片的高度，默认 8000px
     */
    pageSplitHeight?: number;
    /**
     * 页面宽度，默认 900px
     */
    pageWidth?: number;
    /**
     * 调用模块名称，用于日志标识，默认 yuki-plugin
     */
    modelName?: string;
    /**
     * 是否保存 HTML 文件到临时目录，默认 false
     */
    saveHtmlfile?: boolean;
    /**
     * 是否暂停 GIF 动图播放，默认 false
     */
    isPauseGif?: boolean;
};
/**
 * YukiPuppeteerRender 类
 * 提供增强的截图功能，包括分片截图、样式注入、GIF 控制等
 */
export declare class YukiPuppeteerRender {
    private puppeteerInstance;
    constructor(puppeteerInstance: Puppeteer);
    /**
     * 执行截图操作并返回图片 Buffer 数组
     * @param htmlPath HTML 文件的绝对路径
     * @param Options 截图选项配置
     * @returns 失败返回 false，成功返回包含图片 Buffer 数组的对象
     */
    yukiScreenshot(htmlPath: string, Options?: ScreenshotOptions): Promise<false | {
        img: Buffer[];
    }>;
}
