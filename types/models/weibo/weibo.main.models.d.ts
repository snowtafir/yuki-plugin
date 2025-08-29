export declare class WeiboMainModels {
    /**
     * *******************************************************************
     * Login 相关
     * *******************************************************************
     */
    /**申请登陆二维码(web端) */
    static applyLoginQRCode(e: any): Promise<false | {
        qrid: string;
        rid: string;
        X_CSRF_TOKEN: string;
    }>;
    /**处理扫码结果 */
    static pollLoginQRCode(e: any, qrid: string, rid: string, X_CSRF_TOKEN: string): Promise<string | null>;
    /**查看app扫码登陆获取的ck的有效状态*/
    static checkWeiboLogin(e: any): Promise<void>;
    /** 获取ALF值*/
    static extractALFValue(cookieString: string): number | null;
    /**
     * *******************************************************************
     * cookie相关
     * *******************************************************************
     */
    /**保存扫码登录的weiboLoginCK*/
    static saveLoginCookie(e: any, weiboLoginCk: string): Promise<void>;
    /** 读取扫码登陆后缓存的weiboCookie */
    static readLoginCookie(): Promise<any>;
    /** 读取手动绑定的weibo CK */
    static readLocalBiliCk(): Promise<any>;
    /** 覆盖保存手动获取绑定的weibo ck */
    static saveLocalBiliCk(data: any): Promise<void>;
    /** 读取扫码登陆后缓存的weibo cookie的有效时间 */
    static readLoginCookieTTL(): Promise<any>;
    /** 综合获取ck，返回优先级：localCK > loginCK */
    static readSyncCookie(): Promise<{
        cookie: any;
        mark: string;
    }>;
    /**
     * 综合读取、筛选 传入的或本地或redis存储的cookie的item
     * @param {string} mark 读取存储的CK类型，'localCK'  'loginCK' 或传入值 'xxx'并进行筛选
     * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState','ALF']
     * @param {boolean} isInverted 控制正取和反取，true为反取，默认为false正取
     * @returns {string}
     **/
    static readSavedCookieItems(mark: string, items: Array<string>, isInverted?: boolean): Promise<string>;
    static readSavedCookieOtherItems(mark: string, items: Array<string>): Promise<string>;
    /**更新cookie */
    static updateCookieWithSetCookie(setCookieHeaders: string[], mark: string): Promise<void>;
}
