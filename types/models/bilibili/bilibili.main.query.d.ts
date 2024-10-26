export declare class BiliQuery {
    static formatDynamicData(data: any): Promise<{
        uid: any;
        data: {
            [key: string]: any;
        };
    }>;
    static parseRichTextNodes: (nodes: any[] | string | any) => any;
    static getFullArticleContent(postUrl: string): Promise<{
        readInfo: any;
        articleType: string;
    }>;
    static praseFullOldTypeArticleContent(content: string): string;
    static praseFullNewTypeArticleContent: (paragraphs: any[] | any) => {
        content: string;
        img: any[];
    };
    static formatUrl(url: string): string;
    static formatTextDynamicData(upName: string, data: any, isForward: boolean, setData: any): Promise<any>;
    static dynamicContentLimit(content: string, setData: any): string;
    static typeHandle(up: any, msg: string, type: string): unknown[];
}
