import { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
declare class WeiboHttpClient {
    httpsAgent: https.Agent;
    client: AxiosInstance;
    constructor();
    private initializeClient;
    request(url: string, config?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any, any>>;
}
export declare class WeiboWebDataFetcher extends WeiboHttpClient {
    e?: any;
    constructor(e?: any);
    /**通过uid获取博主信息 */
    getBloggerInfo(target: any): Promise<import("axios").AxiosResponse<any, any>>;
    /**通过关键词搜索微博大v */
    searchBloggerInfo(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
    /**获取主页动态资源相关数组 */
    getBloggerDynamicList(target: any): Promise<any>;
}
export {};
