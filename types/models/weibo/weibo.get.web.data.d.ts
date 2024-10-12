import { EventType } from 'yunzai';
export declare class WeiboGetWebData {
    e?: EventType;
    constructor(e?: EventType);
    getBloggerInfo(target: any): Promise<import("axios").AxiosResponse<any, any>>;
    searchBloggerInfo(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
    getBloggerDynamicList(target: any): Promise<any>;
}
