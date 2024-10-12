import { Plugin } from 'yunzai';
export default class YukiBili extends Plugin {
    constructor();
    biliConfigData: any;
    biliPushData: any;
    newPushTask(): Promise<void>;
    addDynamicSub(): Promise<boolean>;
    delDynamicSub(): Promise<void>;
    scanBiliLogin(): Promise<void>;
    delBiliLogin(): Promise<void>;
    myBiliLoginInfo(): Promise<void>;
    addLocalBiliCookie(): Promise<void>;
    delLocalBiliCookie(): Promise<void>;
    myUsingBiliCookie(): Promise<void>;
    reflashTempCk(): Promise<void>;
    allSubDynamicPushList(): Promise<void>;
    singelSubDynamicPushList(): Promise<void>;
    getBilibiUserInfoByUid(): Promise<void>;
    searchBiliUserInfoByKeyword(): Promise<void>;
}
