import { renderToString } from 'react-dom/server';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 组件解析类
 * 负责将 React 组件编译为 HTML，并处理路径格式化
 */
class Component {
    // 组件输出目录
    #dir;
    constructor() {
        this.#dir = join(process.cwd(), '.data', 'component');
    }
    /**
     * 编译 React 组件为 HTML
     * @param options 组件选项
     * @returns HTML 字符串或文件路径
     */
    compile(options) {
        const DOCTYPE = '<!DOCTYPE html>';
        const HTML = renderToString(options.component);
        const html = `${DOCTYPE}${HTML}`;
        // create 为 false 时不创建文件
        if (typeof options?.create === 'boolean' && options?.create === false) {
            // server 模式启动 server 解析
            if (options.server === true) {
                return this.processHtmlPaths(html);
            }
            return html;
        }
        // 创建文件并返回路径
        const dir = join(this.#dir, options?.path ?? '');
        mkdirSync(dir, { recursive: true });
        const address = join(dir, options?.name ?? 'jsxp.html');
        writeFileSync(address, options.server === true ? this.processHtmlPaths(html) : html);
        return address;
    }
    /**
     * 处理 HTML 中的资源路径
     * 将本地文件路径转换为服务器可访问的路径
     * @param html HTML 内容
     * @returns 处理后的 HTML
     */
    processHtmlPaths = (html) => {
        // 使用正则表达式提取所有 src 和 href 属性中的路径
        const attrRegex = /(src|href)=["']([^"']+)["']/g;
        html = html.replace(attrRegex, (match, attr, link) => {
            const url = decodeURIComponent(link);
            if (existsSync(url)) {
                const newPath = `/files?path=${encodeURIComponent(link)}`;
                return `${attr}="${newPath}"`;
            }
            return match;
        });
        // 使用正则表达式提取 CSS 中 url() 的路径
        const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
        html = html.replace(urlRegex, (match, link) => {
            const url = decodeURIComponent(link);
            if (existsSync(url)) {
                const newPath = `/files?path=${encodeURIComponent(link)}`;
                return `url(${newPath})`;
            }
            return match;
        });
        return html;
    };
}

export { Component };
