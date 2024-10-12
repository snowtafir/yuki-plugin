import plugin from '../../../lib/plugins/plugin.js';
export default class YukiWeibo extends plugin {
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
