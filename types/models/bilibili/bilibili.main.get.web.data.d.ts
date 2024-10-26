export declare class BiliGetWebData {
    constructor(e?: any);
    getBiliDynamicListDataByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    getBilibiUserInfoByUid(uid: any): Promise<import("axios").AxiosResponse<any, any>>;
    searchBiliUserInfoByKeyword(keyword: string): Promise<import("axios").AxiosResponse<any, any>>;
}
