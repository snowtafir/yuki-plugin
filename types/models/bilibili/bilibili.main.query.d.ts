export declare class BiliQuery {
    /**
     * 序列化动态数据
     * @param data - 动态数据对象
     * @returns 序列化后的动态数据对象
     */
    static formatDynamicData(data: any): Promise<{
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
    /**获取完整B站文章内容
     * @param postUrl - 文章链接: https://www.bilibili.com/read/cvxxxx 或者 https://www.bilibili.com/opus/xxxx
     * @returns {Json} 完整的B站文章内容json数据
     */
    static getFullArticleContent(postUrl: string): Promise<{
        readInfo: any;
        articleType: string;
    }>;
    /**解析旧版完整文章内容 */
    static praseFullOldTypeArticleContent(content: string): string;
    /**
     * 解析新版完整文章内容，将其转换为HTML格式的正文和图片数组。
     * 该方法处理的是 MODULE_TYPE_CONTENT 类型的文章，文章内容由多个段落组成。
     * 每个段落可能包含不同类型的内容，如正文、图片、链接、表情等。
     *
     * @param paragraphs - MODULE_TYPE_CONTENT 类型文章的段落数组，每个段落是一个对象。
     *                     每个段落对象包含一个 para_type 属性，用于标识段落类型（1表示正文，2表示图片）。
     *                     正文段落中可能包含多个 nodes，每个 node 表示一段文本或一个富文本元素。
     *                     图片段落中包含一个 pic 对象，其中 pics 是图片信息的数组。
     * @returns 返回一个对象，包含两个属性：
     *          - content: string 类型，解析后的HTML格式的正文字符串。
     *          - img: array 类型，包含图片信息的对象数组，每个对象有 url、width 和 height 属性。
     *          如果输入的 paragraphs 不是数组，则返回 null。
     */
    static praseFullNewTypeArticleContent: (paragraphs: any[] | any) => {
        content: string;
        img: any[];
    };
    static formatUrl(url: string): string;
    /**
     * 生成动态消息文字内容
     * @param upName - UP主名称
     * @param formatData - 动态数据
     * @param isForward - 是否为转发动态
     * @param setData - 设置数据
     * @returns 生成的动态消息文字内容
     */
    static formatTextDynamicData(upName: string, data: any, isForward: boolean, setData: any): Promise<"continue" | {
        msg: any[];
        pics: any[];
    }>;
    static dynamicContentLimit(content: string, setData: any): string;
    /**根据关键字更新 up 的动态类型 */
    static typeHandle(up: any, msg: string, type: string): unknown[];
}
