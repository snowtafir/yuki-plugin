export declare function applyLoginQRCode(e: any): Promise<string>;
export declare function pollLoginQRCode(e: any, qrcodeKey: string): Promise<string>;
export declare function checkBiliLogin(e: any): Promise<void>;
export declare function exitBiliLogin(e: any): Promise<void>;
export declare function saveLoginCookie(e: any, biliLoginCk: string): Promise<void>;
export declare function saveLocalBiliCk(data: any): Promise<void>;
export declare function readTempCk(): Promise<any>;
export declare function saveTempCk(newTempCk: any): Promise<void>;
export declare function readSyncCookie(): Promise<{
    cookie: any;
    mark: string;
}>;
export declare function readSavedCookieItems(mark: string, items: Array<string>, isInverted?: boolean): Promise<string>;
export declare function readSavedCookieOtherItems(mark: string, items: Array<string>): Promise<string>;
export declare function genUUID(): Promise<string>;
export declare function gen_b_lsid(): Promise<string>;
export declare function getNewTempCk(): Promise<void>;
export declare function postGateway(cookie: string): Promise<import("axios").AxiosResponse<any, any>>;
export declare function get_buvid_fp(cookie: string): Promise<string>;
export declare function cookieWithBiliTicket(cookie: string): Promise<string>;
