declare class BiliApi {
    biliConfigData: any;
    USER_AGENT: string;
    constructor();
    static BILIBILI_USER_AGENT: string;
    initialize(): Promise<void>;
    initUserAgent(): Promise<void>;
    get BILIBIL_API(): {
        biliServerTimeStamp: string;
        biliDynamicInfoList: string;
        biliUpFollowFans: string;
        biliSpaceUserInfo: string;
        biliSpaceUserInfoWbi: string;
        biliSearchUp: string;
        biliSearchUpWbi: string;
        biliVideoInfo: string;
        biliVideoInfoWbi: string;
        biliShortVideoUrl: string;
        biliLiveStatus: string;
        biliCard: string;
        biliStat: string;
        biliLiveUserInfo: string;
        biliOpusDetail: string;
    };
    /**header */
    get BILIBILI_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        Connection: string;
        'Accept-Encoding': string;
        Cookie: string;
        pragma: string;
        'Cache-control': string;
        DNT: string;
        'Sec-GPC': string;
        'sec-ch-ua-platform': string;
        'sec-ch-ua-mobile': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-Fetch-User': string;
        Priority: string;
        TE: string;
        'User-Agent': string;
    };
    /**Login header */
    get BIlIBILI_LOGIN_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        DNT: string;
        'Sec-GPC': string;
        'Upgrade-Insecure-Requests': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-Fetch-User': string;
        TE: string;
    };
    /**FullArticle header */
    get BILIBILI_ARTICLE_HEADERS(): {
        Accept: string;
        'Accept-Language': string;
        'Accept-Encoding': string;
        'Content-type': string;
        Cookie: string;
        pragma: string;
        'Cache-control': string;
        DNT: string;
        'Sec-GPC': string;
        'sec-ch-ua-mobile': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-Fetch-User': string;
        TE: string;
        'Upgrade-Insecure-Requests': string;
        'User-Agent': string;
    };
    get BILIBILI_DYNAMIC_SPACE_HEADERS(): {
        Accept: string;
        'Accept-Encoding': string;
        'Accept-Language': string;
        Connection: string;
        Priority: string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'Sec-Fetch-User': string;
        'Sec-GPC': string;
        'Upgrade-Insecure-Requests': string;
        'User-Agent': string;
    };
    /**返回GatWay payload */
    BILIBILI_BROWSER_DATA(_uuid: string): Promise<{
        '3064': number;
        '5062': string;
        '03bf': string;
        '39c8': string;
        '34f1': string;
        d402: string;
        '654a': string;
        '6e7c': string;
        '3c43': {
            '2673': number;
            '5766': number;
            '6527': number;
            '7003': number;
            '807e': number;
            b8ce: string;
            '641c': number;
            '07a4': string;
            '1c57': string;
            '0bd0': number;
            '748e': number[];
            d61f: number[];
            fc9d: number;
            '6aa9': string;
            '75b8': number;
            '3b21': number;
            '8a1c': number;
            d52f: string;
            adca: string;
            '80c9': (string | string[][])[][];
            '13ab': string;
            bfe9: string;
            a3c1: string[];
            '6bc5': string;
            ed31: number;
            '72bd': number;
            '097b': number;
            '52cd': number[];
            a658: string[];
            d02f: string;
        };
        '54ef': {
            'in_new_ab ': boolean;
            'ab_version ': {
                'waterfall_article ': string;
            };
            'ab_split_num ': {
                'waterfall_article ': number;
            };
        };
        '8b94': string;
        df35: string;
        '07a4': string;
        '5f45': any;
        db46: number;
    }>;
    /**返回Bilibili Fingerprint data */
    BILIBILI_FINGERPRINT_DATA(_uuid: string): {
        userAgent: string;
        webdriver: boolean;
        language: string;
        colorDepth: number;
        deviceMemory: string;
        pixelRatio: number;
        hardwareConcurrency: number;
        screenResolution: string;
        availableScreenResolution: string;
        timezoneOffset: number;
        timezone: string;
        sessionStorage: boolean;
        localStorage: boolean;
        indexedDb: boolean;
        addBehavior: boolean;
        openDatabase: boolean;
        cpuClass: string;
        platform: string;
        doNotTrack: any;
        plugins: {
            name: string;
            description: string;
            mimeTypes: string[][];
        }[];
        canvas: string;
        webgl: string;
        webglVendorAndRenderer: string;
        adBlock: boolean;
        hasLiedLanguages: boolean;
        hasLiedResolution: boolean;
        hasLiedOs: boolean;
        hasLiedBrowser: boolean;
        touchSupport: number;
        fonts: string[];
        fontsFlash: boolean;
        audio: string;
        enumerateDevices: string[];
    };
}
declare const _default: BiliApi;
export default _default;
