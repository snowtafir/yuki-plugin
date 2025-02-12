export declare class BilibiliWebDataFetcher {
    constructor(e?: any);
    /**通过uid获取up动态数据表*/
    getBiliDynamicListDataByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    /**通过uid获取up详情*/
    getBilibiUserInfoByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    /**通过关键词搜索up*/
    searchBiliUserInfoByKeyword(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
}
