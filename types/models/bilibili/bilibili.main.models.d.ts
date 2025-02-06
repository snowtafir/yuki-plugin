/**
 * *******************************************************************
 * Login 相关
 * *******************************************************************
 */
/**申请登陆二维码(web端) */
export declare function applyLoginQRCode(e: any): Promise<string>;
/**处理扫码结果 */
export declare function pollLoginQRCode(e: any, qrcodeKey: string): Promise<string>;
/**查看app扫码登陆获取的ck的有效状态*/
export declare function checkBiliLogin(e: any): Promise<void>;
/**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
export declare function exitBiliLogin(e: any): Promise<void>;
/**
 * *******************************************************************
 * cookie相关
 * *******************************************************************
 */
/**保存扫码登录的loginCK*/
export declare function saveLoginCookie(e: any, biliLoginCk: string): Promise<void>;
/** 读取扫码登陆后缓存的cookie */
export declare function readLoginCookie(): Promise<any>;
/** 覆盖保存手动获取绑定的B站ck */
export declare function saveLocalBiliCk(data: any): Promise<void>;
/** 读取缓存的tempCK */
export declare function readTempCk(): Promise<any>;
/**保存tempCK*/
export declare function saveTempCk(newTempCk: any): Promise<void>;
/** 综合获取ck，返回优先级：localCK > loginCK > tempCK */
export declare function readSyncCookie(): Promise<{
    cookie: any;
    mark: string;
}>;
/**
 * 综合读取、筛选 传入的或本地或redis存储的cookie的item
 * @param {string} mark 读取存储的CK类型，'localCK' 'tempCK' 'loginCK' 或传入值 'xxx'并进行筛选
 * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid']
 * @param {boolean} isInverted 控制正取和反取，true为反取，false为正取
 * @returns {string}
 **/
export declare function readSavedCookieItems(mark: string, items: Array<string>, isInverted?: boolean): Promise<string>;
export declare function readSavedCookieOtherItems(mark: string, items: Array<string>): Promise<string>;
/** 生成 _uuid */
export declare function genUUID(): Promise<string>;
/**生成 b_lsid */
export declare function gen_b_lsid(): Promise<string>;
/**获取新的tempCK*/
export declare function getNewTempCk(): Promise<string>;
/**
 * *******************************************************************
 * 风控相关函数
 * *******************************************************************
 */
/**
 * 请求参数POST接口(ExClimbWuzhi)过校验
 * @param cookie 请求所需的cookie
 * @returns 返回POST请求的结果
 */
export declare function postGateway(cookie: string): Promise<import("axios").AxiosResponse<any, any>>;
/**生成buvid_fp
 * @param {string} uuid
 */
export declare function get_buvid_fp(cookie: string): Promise<string>;
/**
 * 获取有效bili_ticket并添加到cookie
 * @param {string} cookie
 * @returns {Promise<{ cookie: string; }>} 返回包含最新有效的bili_ticket的cookie
 */
export declare function cookieWithBiliTicket(cookie: string): Promise<string>;
