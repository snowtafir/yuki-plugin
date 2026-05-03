import { ComponentCreateOpsionType } from './types';
/**
 * 组件解析类
 * 负责将 React 组件编译为 HTML，并处理路径格式化
 */
export declare class Component {
    #private;
    constructor();
    /**
     * 编译 React 组件为 HTML
     * @param options 组件选项
     * @returns HTML 字符串或文件路径
     */
    compile(options: ComponentCreateOpsionType): string;
    /**
     * 处理 HTML 中的资源路径
     * 将本地文件路径转换为服务器可访问的路径
     * @param html HTML 内容
     * @returns 处理后的 HTML
     */
    processHtmlPaths: (html: string) => string;
}
