export declare class WeiboGetWebData {
    e?: any;
    constructor(e?: any);
    getBloggerInfo(target: any): Promise<import("axios").AxiosResponse<any, any>>;
    searchBloggerInfo(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
    getBloggerDynamicList(target: any): Promise<any>;
}
