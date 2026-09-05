export declare class BilibiliWebDataFetcher {
    constructor(e?: any);
    /**通过uid获取up动态数据表*/
    getBiliDynamicListDataByUid(uid: any): Promise<import("axios").AxiosResponse<any, any, {}, {
        w_rid: string;
        wts: number;
        'x-bili-device-req-json': {
            platform: string;
            device: string;
        };
        'x-bili-web-req-json': {
            spm_id: string;
        };
        dm_img_list: string;
        dm_img_str: string;
        dm_cover_img_str: string;
        dm_img_inter: string;
        offset: string;
        host_mid: any;
        timezone_offset: number;
        platform: string;
        features: string;
        web_location: string;
    }>>;
    /**通过uid获取up详情*/
    getBilibiUserInfoByUid(uid: any): Promise<import("axios").AxiosResponse<any, any, {}, {
        w_rid: string;
        wts: number;
        dm_img_list: string;
        dm_img_str: string;
        dm_cover_img_str: string;
        dm_img_inter: string;
        mid: any;
        token: string;
        platform: string;
        web_location: number;
    }>>;
    /**通过关键词搜索up*/
    searchBiliUserInfoByKeyword(keyword: string): Promise<import("axios").AxiosResponse<any, any, {}, {
        w_rid: string;
        wts: number;
        keyword: string;
        page: number;
        search_type: string;
        order: string;
    }>>;
    getBiliVideoInfoByAid_BV(vedioID: {
        aid?: number;
        bvid?: string;
    }): Promise<import("axios").AxiosResponse<any, any, {}, {
        w_rid: string;
        wts: number;
        bvid: string;
        aid?: undefined;
    } | {
        w_rid: string;
        wts: number;
        aid: number;
        bvid?: undefined;
    }>>;
    getBVIDByShortUrl(tvUrlID: string): Promise<string | false>;
}
