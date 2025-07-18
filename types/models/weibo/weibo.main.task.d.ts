import { MainProps } from '@/components/dynamic/MainPage';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
export declare class WeiboTask {
    taskName: string;
    groupKey: string;
    privateKey: string;
    e?: any;
    constructor(e?: any);
    /**
     * 执行动态推送任务
     */
    runTask(): Promise<void>;
    /**
     * 处理微博数据，获取动态列表并构建 uid 映射
     * @param weiboPushData 微博推送数据
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     */
    processWeiboData(weiboPushData: {
        group?: {
            [chatId: string]: {
                bot_id: string;
                uid: string;
                name: string;
                type: string[];
            }[];
        };
        private?: {
            [chatId: string]: {
                bot_id: string;
                uid: string;
                name: string;
                type: string[];
            }[];
        };
    }, uidMap: Map<any, Map<string, Map<string, Map<string, {
        upName: string;
        types: string[];
    }>>>>, dynamicList: any): Promise<void>;
    /**
     * 构建uid对应动态数据映射
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param now 当前时间戳
     * @param dynamicTimeRange 筛选何时发布的动态
     * @param weiboConfigData 微博配置数据
     */
    makeUidDynamicDataMap(uidMap: Map<string, Map<string, Map<string, Map<string, {
        upName: string;
        types: string[];
    }>>>>, dynamicList: any, now: number, dynamicTimeRange: number, weiboConfigData: any, messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>): Promise<void>;
    /**
     * 渲染构建待发送的动态消息数据的映射数组
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param upName 博主用户名
     * @param pushDynamicData 推送动态数据
     * @param weiboConfigData 微博配置数据
     * @param chatType 聊天类型
     * @param messageMap 待发送的动态消息映射
     */
    makeDynamicMessageMap(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, weiboConfigData: any, chatType: string, messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>): Promise<string>;
    /**
     * 构建渲染数据
     * @param extentData 扩展数据
     * @param urlQrcodeData URL 二维码数据
     * @param boxGrid 是否启用九宫格样式
     * @returns 渲染数据
     */
    buildRenderData(extentData: any, urlQrcodeData: string, boxGrid: boolean): MainProps;
    /**
     * 渲染动态卡片
     * @param uid 用户 ID
     * @param renderData 渲染数据
     * @param ScreenshotOptionsData 截图选项数据
     * @returns 图片数据
     */
    renderDynamicCard(uid: string | number, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions): Promise<Buffer[] | null>;
    /**
     * 收集消息映射
     * @param messageMap 消息映射
     * @param chatType 聊天类型
     * @param bot_id 机器人 ID
     * @param chatId 聊天 ID
     * @param sendMode 发送模式: SINGLE 逐条发送，MERGE 合并发送
     * @param dynamicUUid_str 动态 UUID
     * @param dynamicType 动态类型
     * @param message 消息内容
     */
    addMessageToMap(messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>, chatType: string, bot_id: string | number, chatId: string | number, sendMode: string, dynamicUUid_str: string, dynamicType: string, messages: any): Promise<void>;
    /**
     * 推送动态消息
     * @param messageMap 消息映射
     * @param biliConfigData 微博配置数据
     */
    sendDynamicMessage(messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>, weiboConfigData: {
        [key: string]: any;
    }): Promise<void>;
    /**
     * 发送消息api
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     */
    sendMsgApi(chatId: string | number, bot_id: string | number, chatType: string, message: any): Promise<boolean>;
    /**
     * 发送合并转发消息
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     * @returns 是否发送成功
     */
    sendForwardMsgApi(chatId: string | number, bot_id: string | number, chatType: string, forwardNodes: Array<any>): Promise<boolean>;
    /**
     * 随机延时
     * @param min 最小延时时间
     * @param max 最大延时时间
     */
    randomDelay(min: number, max: number): Promise<void>;
}
