import { ComponentCreateOpsionType } from 'jsxp';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
/**
 * 渲染列队中的任务
 * @param uid 唯一标识符
 * @param page 组件名称
 * @param props 传入的组件参数
 * @param ComponentCreateOpsion 组件创建选项
 * @param ScreenshotOptions 截图选项
 * @returns {false | {img: buffer[]}}
 */
declare const renderPage: <T = any>(uid: number | string, page: string, props?: T, ScreenshotOptions?: ScreenshotOptions, ComponentCreateOpsion?: ComponentCreateOpsionType) => Promise<false | {
    img: Buffer[];
}>;
export { renderPage };
