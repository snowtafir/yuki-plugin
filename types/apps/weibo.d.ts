import { Plugin } from '@/utils/host';
export default class YukiWeibo extends Plugin {
    constructor();
    weiboConfigData: any;
    weiboPushData: any;
    /** 微博动态推送定时任务 */
    newPushTask(): Promise<void>;
    /** 添加微博动态订阅 */
    addDynamicSub(): Promise<boolean>;
    /** 删除微博动态订阅 */
    delDynamicSub(): Promise<void>;
    /** 订阅的全部微博推送列表 */
    allSubDynamicPushList(): Promise<void>;
    /** 单独群聊或私聊的订阅的b站推送列表 */
    singelSubDynamicPushList(): Promise<void>;
    /**通过uid获取up主信息 */
    getWeiboUserInfoByUid(): Promise<boolean>;
    /** 根据昵称搜索博主信息*/
    searchWeiboUserInfoByKeyword(): Promise<void>;
}
