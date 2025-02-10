import { AxiosInstance, AxiosRequestConfig } from 'axios';
declare class BiliHttpClient {
    client: AxiosInstance;
    constructor();
    private initializeClient;
    request(url: string, config?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any, any>>;
}
export declare class BilibiliWebDataFetcher extends BiliHttpClient {
    constructor(e?: any);
    /**通过uid获取up动态数据表*/
    getBiliDynamicListDataByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    /**通过uid获取up详情*/
    getBilibiUserInfoByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    /**通过关键词搜索up*/
    searchBiliUserInfoByKeyword(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
}
export {};
