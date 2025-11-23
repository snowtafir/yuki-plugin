declare class WeiboApi {
    weiboConfigData: any;
    USER_AGENT: string;
    constructor();
    static WEIBO_USER_AGENT: string;
    initialize(): Promise<void>;
    initUserAgent(): Promise<void>;
    get WEIBO_API(): {
        weiboGetIndex: string;
    };
    /**统一设置header */
    get WEIBO_HEADERS(): {
        Accept: string;
        'Accept-Encoding': string;
        'Accept-Language': string;
        Connection: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'X-Requested-With': string;
        'MWeibo-Pwa': string;
        'User-Agent': string;
    };
    get WEIBO_GET_X_CSRF_TOKEN_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'Sec-GPC': string;
        Connection: string;
        'Upgrade-Insecure-Requests': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-Fetch-User': string;
        Priority: string;
        'User-agent': string;
    };
    get WEIBO_LOGIN_QR_CODE_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'X-Requested-With': string;
        'X-CSRF-TOKEN': string;
        'Sec-GPC': string;
        Connection: string;
        Referer: string;
        Cookie: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        Priority: string;
        'User-agent': string;
    };
    get WEIBO_LOGIN_QR_CODE_IMAGE_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'Sec-GPC': string;
        Connection: string;
        Referer: string;
        Cookie: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        Priority: string;
        'User-agent': string;
    };
    get WEIBO_GET_BD_TOKEN_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'Content-Type': string;
        Host: string;
        Origin: string;
        Priority: string;
        Referer: string;
        Connection: string;
        Cookie: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-GPC': string;
        TE: string;
        'User-Agent': string;
    };
    get WEIBO_POLL_LOGIN_STATUS_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'X-Requested-With': string;
        'X-CSRF-TOKEN': string;
        'Sec-GPC': string;
        Connection: string;
        Referer: string;
        Cookie: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        TE: string;
        'User-agent': string;
    };
    get WEIBO_COOKIE_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        Connection: string;
        Referer: string;
        'Upgrade-Insecure-Requests': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        Priority: string;
        TE: string;
        'User-agent': string;
    };
}
declare const _default: WeiboApi;
export default _default;
