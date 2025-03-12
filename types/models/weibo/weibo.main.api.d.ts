declare class WeiboApi {
    weiboConfigData: any;
    USER_AGENT: string;
    constructor();
    static WEIBO_USER_AGENT: string;
    initialize(): Promise<void>;
    initUserAgent(): Promise<void>;
    get WEIBO_API(): {
        weiboGetIndex: string;
        weiboAjaxSearch: string;
    };
    /**统一设置header */
    get WEIBO_HEADERS(): {
        Accept: string;
        'Accept-language': string;
        Authority: string;
        'Cache-control': string;
        'Sec-fetch-dest': string;
        'Sec-fetch-mode': string;
        'Sec-fetch-site': string;
        'Upgrade-insecure-requests': string;
        'User-agent': string;
    };
}
declare const _default: WeiboApi;
export default _default;
