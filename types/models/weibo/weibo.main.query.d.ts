export declare class WeiboQuery {
    /**获取文章id */
    static getDynamicId(post: any): any;
    /**获取指定动态类型的原始数据 */
    static filterCardTypeCustom(raw_post: any): boolean;
    /**转换微博动态创建时间：（created_at）转换为 UNIX 时间戳（以毫秒为单位） */
    static getDynamicCreatetDate(raw_post: any): number;
    /**分类动态，返回标识 */
    static MakeCategory(raw_post: any): "DYNAMIC_TYPE_AV" | "DYNAMIC_TYPE_DRAW" | "DYNAMIC_TYPE_ARTICLE" | "DYNAMIC_TYPE_FORWARD" | "DYNAMIC_TYPE_UNKNOWN";
    /**筛选正文 */
    static filterText(raw_text: string): string;
    /** 获取并生成微博动态渲染数据 */
    static formatDynamicData(raw_post: any): Promise<{
        uid: any;
        data: {
            [key: string]: any;
        };
    }>;
    /**
     * 动态内容富文本节点解析
     * @param nodes - 动态内容富文本节点
     * @returns 解析后的动态内容富文本
     */
    static parseRichTextNodes: (nodes: any[] | string | any) => any;
    /**
     * 生成动态消息文字内容
     * @param upName - UP主名称
     * @param formatData - 动态数据
     * @param isForward - 是否为转发动态
     * @param setData - 设置数据
     * @returns 生成的动态消息文字内容
     */
    static formatTextDynamicData(upName: string, raw_post: any, isForward?: boolean, setData?: any): Promise<"continue" | {
        msg: any[];
        pics: any[];
    }>;
    static dynamicContentLimit(content: string, setData: any): string;
    static formatUrl(url: string): string;
    /**推送类型设置 */
    static typeHandle(up: any, msg: string, type: string): unknown[];
}
