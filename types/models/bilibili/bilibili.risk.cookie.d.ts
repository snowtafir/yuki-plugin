import * as tough from 'tough-cookie';
declare class BiliRiskCookie {
    cookieJar: tough.CookieJar;
    prefix: string;
    constructor();
    initialize(): Promise<void>;
    getSessionCookieJar(): Promise<tough.CookieJar>;
    /** 生成 _uuid */
    genUUID(): Promise<string>;
    /**生成 b_lsid */
    gen_b_lsid(): Promise<string>;
    /** 获取 buvid3 和 buvid4 */
    getBuvid3_4(uuid: string): Promise<string>;
    /**生成buvid_fp */
    get_buvid_fp(uuid: string): Promise<string>;
    /**获取新的tempCK（并写入 Jar）*/
    getNewTempCk(): Promise<string>;
    /**
     * B站扫码登录流程
     */
    biliLogin(e: any): Promise<void>;
    /**申请登陆二维码(web端) */
    applyLoginQRCode(e: any): Promise<string>;
    /**处理扫码结果（扫码成功后将 set-cookie 写入 Jar 并持久化）*/
    pollLoginQRCode(e: any, qrcodeKey: string): any;
    /**查看当前 Jar 中的登录 cookie 有效状态并返回信息（改为基于 jar）*/
    checkBiliLogin(e: any): Promise<boolean>;
    /**
     * 请求参数POST接口(ExClimbWuzhi)过校验
     */
    postGateway(cookie: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
    /**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
    exitBiliLogin(e: any): Promise<void>;
    /**
     * 获取有效bili_ticket并添加到cookie（bili_ticket 仍缓存于 Redis 单独 key）
     */
    checkCookieBiliTicket(): Promise<string>;
    /**
     * 将 非标准化 bilibili 的 cookie 写入 jar 并持久化到 Redis
     * 支持两种输入形式：
     * 1. Cookie 数组：[{ key: 'name', value: 'value', 'domain': 'domain', 'expires': new Date() ,'path': 'path', 'httpOnly': true, 'secure': true }, ...]
     * 2. 字符串形式：'a=1; b=2;'
     */
    setCookieString(input: string | tough.Cookie[], url?: string): Promise<void>;
    /**
     * 简单策略：优先从 Redis 读取长期 cookie（如 SUP/SUBP），若缺失则触发完整获取流程
     * */
    ensureLoginCookies(jar: tough.CookieJar): Promise<boolean>;
    /** 从 Redis 恢复到 cookieJar */
    loadCookiesFromRedis(jar: tough.CookieJar): Promise<void>;
    /** 从 CookieJar 中读取所有 cookie 并保存到 Redis（按 name/domain 存） */
    /**
     * 将 CookieJar 中的所有 Cookie 同步到 Redis
     */
    saveCookiesToRedis(jar: tough.CookieJar): Promise<void>;
    /** 清空 jar 与 Redis 中该前缀的 cookie */
    resetCookiesAndRedis(): Promise<void>;
    /** 从 jar 中获取指定 URL 的 cookie 字符串 */
    getCookieStringForUrl(url: string): Promise<string>;
    /** 从 jar 中获取指定 key 的值（基于 url） */
    getCookieValueByKeyFromString(jar: tough.CookieJar, key: string, url: string): Promise<string | undefined>;
    /**
     * 获取指定 key 的 Cookie 的过期时间（时间戳，毫秒级）
     * @param jar CookieJar 实例
     * @param key 要查询的 Cookie 键名
     * @param url 与 Cookie 关联的 URL
     * @returns 过期时间的时间戳（毫秒级）或 null（如果未设置）
     */
    getCookieExpiration(jar: tough.CookieJar, key: string, url: string): Promise<number | null>;
    /** 综合获取ck，返回优先级：localCK > loginCK > tempCK */
    readSyncCookie(): Promise<{
        cookie: string | tough.CookieJar;
        mark: 'localCk' | 'loginCk' | 'tempCk' | 'ckIsEmpty';
    }>;
    /** 读取手动绑定的B站ck */
    readLocalBiliCk(): Promise<any>;
    /** 覆盖保存手动获取绑定的B站ck */
    saveLocalBiliCk(data: any): Promise<void>;
    /**
     * 综合读取、筛选 传入的或本地或redis存储的cookie的item
     * @param {string} mark 读取存储的CK类型，'localCK'  'loginCK' 或传入值 'xxx'并进行筛选
     * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState','ALF']
     * @param {boolean} isInverted 控制正取和反取，true为反取，默认为false正取
     * @returns {string}
     **/
    readSavedCookieItems(mark: string, items: Array<string>, isInverted?: boolean): Promise<string>;
    readSavedCookieOtherItems(mark: string, items: Array<string>): Promise<string>;
}
declare const BiliCookieManager: BiliRiskCookie;
export default BiliCookieManager;
