import { ComponentCreateOpsionType } from '@/utils/package/jsxp';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
/**
 * 渲染 React 组件为图片
 * 通过任务队列管理，确保多个渲染请求按顺序执行，避免并发问题
 *
 * @param uid 唯一标识符，用于生成 HTML 文件名
 * @param page 组件名称，对应 components/index 中导出的组件
 * @param props 传入组件的参数
 * @param screenshotOptions 截图选项配置
 * @param componentCreateOption 组件创建选项
 * @returns Promise，失败返回 false，成功返回包含图片 Buffer 数组的对象
 *
 * @example
 * ```typescript
 * const result = await renderPage('user123', 'MainPage', { title: 'Hello' }, {
 *   SOptions: { type: 'png', quality: 100 },
 *   isSplit: true
 * });
 * if (result) {
 *   // result.img 是 Buffer 数组
 * }
 * ```
 */
declare const renderPage: <T = any>(uid: number | string, page: string, props?: T, screenshotOptions?: ScreenshotOptions, componentCreateOption?: ComponentCreateOpsionType) => Promise<false | {
    img: Buffer[];
}>;
export { renderPage };
