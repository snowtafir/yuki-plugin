export declare class WeiboQuery {
    static getDynamicId(post: any): any;
    static filterCardTypeCustom(raw_post: any): boolean;
    static getDynamicCreatetDate(raw_post: any): number;
    static MakeCategory(raw_post: any): "DYNAMIC_TYPE_AV" | "DYNAMIC_TYPE_DRAW" | "DYNAMIC_TYPE_ARTICLE" | "DYNAMIC_TYPE_FORWARD";
    static filterText(raw_text: string): string;
    static formatDynamicData(raw_post: any): Promise<{
        uid: any;
        data: {
            [key: string]: any;
        };
    }>;
    static parseRichTextNodes: (nodes: any[] | string | any) => any;
    static formatTextDynamicData(upName: string, raw_post: any, isForward?: boolean, setData?: any): Promise<false | any[] | "continue">;
    static dynamicContentLimit(content: string, setData: any): string;
    static formatUrl(url: string): string;
    static typeHandle(up: any, msg: string, type: string): unknown[];
}
