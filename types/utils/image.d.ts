import { ComponentCreateOpsionType } from 'react-puppeteer';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
declare const renderPage: <T = any>(uid: number | string, page: string, props?: T, ScreenshotOptions?: ScreenshotOptions, ComponentCreateOpsion?: ComponentCreateOpsionType) => Promise<false | {
    img: Buffer[];
}>;
export { renderPage };
