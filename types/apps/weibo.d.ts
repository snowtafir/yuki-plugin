import { Plugin } from 'yunzaijs';
export default class YukiWeibo extends Plugin {
    constructor();
    weiboConfigData: any;
    weiboPushData: any;
    newPushTask(): Promise<void>;
    addDynamicSub(): Promise<boolean>;
    delDynamicSub(): Promise<void>;
    allSubDynamicPushList(): Promise<void>;
    singelSubDynamicPushList(): Promise<void>;
    getWeiboUserInfoByUid(): Promise<boolean>;
    searchWeiboUserInfoByKeyword(): Promise<void>;
}
