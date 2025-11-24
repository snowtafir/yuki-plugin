import * as tough from 'tough-cookie';
declare class WeiboRiskCookie {
    cookieJar: tough.CookieJar;
    prefix: string;
    constructor();
    initialize(): Promise<void>;
    static getHeadersForStep(step: any, referer?: string): ({
        accept: string;
        'accept-encoding': string;
        'accept-language': string;
        priority: string;
        'sec-fetch-dest': string;
        'sec-fetch-mode': string;
        'sec-fetch-site': string;
        'user-agent': string;
    } & {
        referer: string;
    }) | ({
        accept: string;
        'accept-encoding': string;
        'accept-language': string;
        priority: string;
        'sec-fetch-dest': string;
        'sec-fetch-mode': string;
        'sec-fetch-site': string;
        'user-agent': string;
    } & {
        referer?: undefined;
    }) | {
        accept: string;
        'accept-encoding': string;
        'accept-language': string;
        priority: string;
        'sec-fetch-dest': string;
        'sec-fetch-mode': string;
        'sec-fetch-site': string;
        'sec-fetch-user': string;
        'upgrade-insecure-requests': string;
        'user-agent': string;
        'content-type'?: undefined;
        origin?: undefined;
        referer?: undefined;
        'sec-fetch-storage-access'?: undefined;
        'cache-control'?: undefined;
        'if-modified-since'?: undefined;
    } | {
        accept: string;
        'accept-encoding': string;
        'accept-language': string;
        'content-type': string;
        origin: string;
        priority: string;
        referer: string;
        'sec-fetch-dest': string;
        'sec-fetch-mode': string;
        'sec-fetch-site': string;
        'sec-fetch-storage-access': string;
        'user-agent': string;
        'sec-fetch-user'?: undefined;
        'upgrade-insecure-requests'?: undefined;
        'cache-control'?: undefined;
        'if-modified-since'?: undefined;
    } | {
        accept: string;
        'accept-encoding': string;
        'accept-language': string;
        'cache-control': string;
        'content-type': string;
        'if-modified-since': string;
        origin: string;
        priority: string;
        referer: string;
        'sec-fetch-dest': string;
        'sec-fetch-mode': string;
        'sec-fetch-site': string;
        'user-agent': string;
        'sec-fetch-user'?: undefined;
        'upgrade-insecure-requests'?: undefined;
        'sec-fetch-storage-access'?: undefined;
    } | {
        accept?: undefined;
        'accept-encoding'?: undefined;
        'accept-language'?: undefined;
        priority?: undefined;
        'sec-fetch-dest'?: undefined;
        'sec-fetch-mode'?: undefined;
        'sec-fetch-site'?: undefined;
        'sec-fetch-user'?: undefined;
        'upgrade-insecure-requests'?: undefined;
        'user-agent'?: undefined;
        'content-type'?: undefined;
        origin?: undefined;
        referer?: undefined;
        'sec-fetch-storage-access'?: undefined;
        'cache-control'?: undefined;
        'if-modified-since'?: undefined;
    };
    fetchInitialHtml(jar: tough.CookieJar): Promise<any>;
    static extractParamsFromHtml(html: string): {
        request_id: string;
        return_url: string;
        ver: string;
        from: string;
    };
    static extractTidFromJarSync(jar: any): any;
    static buildSimpleFingerprint(): string;
    static getUmdPublicKeyDer(): Buffer<ArrayBuffer>;
    static derToPem(derBuf: Buffer<ArrayBuffer>): string;
    makeBdPayload(fpStr: any): Promise<string>;
    postFormWithJar(url: any, jar: any, dataObj: any, extraHeaders?: {}): Promise<import("axios").AxiosResponse<any, any, {}>>;
    static parseCallbackJs(jsText: any, cbName?: string): any;
    getNewSessionCookie(): Promise<void>;
    getSessionCookieJar(): Promise<tough.CookieJar>;
    /**
     * 简单策略：优先从 Redis 读取长期 cookie（如 SUP/SUBP），若缺失则触发完整获取流程
     * */
    ensureLongLivedCookies(jar: tough.CookieJar): Promise<boolean>;
    /** 从 Redis 恢复 Cookie 到 CookieJar */
    loadCookiesFromRedis(jar: tough.CookieJar): Promise<void>;
    /**
     * 将 CookieJar 中的所有 Cookie 同步到 Redis
     */
    saveCookiesToRedis(jar: tough.CookieJar): Promise<void>;
    /**
     * 删除所有 Cookie 并同步清除 Redis 缓存
     */
    resetCookiesAndRedis(): Promise<void>;
    getCookieValueByKeyFromString(jar: tough.CookieJar, key: string, url: string): Promise<string | null>;
    /**
     * *******************************************************************
     * 微博登录
     * *******************************************************************
     */
    /**查看当前ck是否登录*/
    checkWeiboLogin(e: any): Promise<boolean>;
    /**
     * 扫码登录流程
     */
    weiboLogin(e: any): Promise<any>;
    /**
     * 登录前访问bd接口获取rid
     * @param {string} X_CSRF_TOKEN - X_CSRF_TOKEN
     * @returns {Promise<JSON>} 服务器响应结果
     */
    getRidFromBd(X_CSRF_TOKEN: string): Promise<{
        retcode?: number;
        msg?: string;
        data?: {
            rid?: string;
        };
    } | {
        retcode: number;
        msg: string;
        error: string;
        data: {};
    }>;
    /**申请登陆二维码(web端) */
    applyLoginQRCode(e: any): Promise<false | {
        qrid: string;
        rid: string;
        X_CSRF_TOKEN: string;
    }>;
    /**处理扫码结果 */
    pollLoginQRCode(e: any, qrid: string, rid: string, X_CSRF_TOKEN: string): any;
}
declare const WeiboCookieManager: WeiboRiskCookie;
export default WeiboCookieManager;
