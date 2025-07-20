import { Plugin } from '@/utils/host';
export default class YukiBili extends Plugin {
    constructor();
    biliConfigData: any;
    biliPushData: any;
    /** B站动态推送定时任务 */
    newPushTask(): Promise<void>;
    /** 添加B站动态订阅 */
    addDynamicSub(): Promise<boolean>;
    /** 删除B站动态订阅 */
    delDynamicSub(): Promise<void>;
    /** 扫码登录B站 */
    scanBiliLogin(): Promise<void>;
    /** 删除登陆的B站ck */
    delBiliLogin(): Promise<void>;
    /**验证B站登录 */
    myBiliLoginInfo(): Promise<void>;
    /** 手动绑定本地获取的B站cookie */
    addLocalBiliCookie(): Promise<void>;
    /** 删除绑定的本地B站ck */
    delLocalBiliCookie(): Promise<void>;
    /** 当前正在使用的B站ck */
    myUsingBiliCookie(): Promise<void>;
    /** 删除并刷新redis缓存的临时B站ck */
    reflashTempCk(): Promise<void>;
    /** 订阅的全部b站推送列表 */
    allSubDynamicPushList(): Promise<void>;
    /** 单独群聊或私聊的订阅的b站推送列表 */
    singelSubDynamicPushList(): Promise<void>;
    /**通过uid获取up主信息 */
    getBilibiUserInfoByUid(): Promise<void>;
    /** 根据名称搜索up的uid*/
    searchBiliUserInfoByKeyword(): Promise<void>;
    /** 根据aid或bvid获解析频信息*/
    getVideoInfoByAid_BV(): Promise<boolean>;
}
