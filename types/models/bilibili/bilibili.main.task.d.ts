import { MainProps } from '@/components/dynamic/MainPage';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
import { BilibiliWebDataFetcher } from '@/models/bilibili/bilibili.main.get.web.data';
export declare class BiliTask {
    taskName: string;
    groupKey: string;
    privateKey: string;
    BilibiliWebDataFetcher: BilibiliWebDataFetcher;
    e?: any;
    constructor(e?: any);
    hendleEventDynamicData(uid: string | number, count?: number): Promise<any>;
    /**
     * 执行动态推送任务
     */
    runTask(): Promise<void>;
    /**
     * 处理Bilibili数据，获取动态列表并构建 uid 映射
     * @param biliPushData Bilibili推送数据
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param lastLiveStatus 最后直播状态
     */
    processBiliData(biliPushData: {
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
    }, biliConfigData: any, uidMap: Map<any, Map<string, any>>, dynamicList: any): Promise<void>;
    /**
     * 构建uid对应动态数据映射
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param now 当前时间戳
     * @param interval 推送间隔时间
     * @param biliConfigData Bilibili配置数据
     */
    makeUidDynamicDataMap(uidMap: Map<any, Map<string, any>>, dynamicList: any, now: number, interval: number, biliConfigData: any, messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>): Promise<void>;
    /**
     * 渲染构建待发送的动态消息数据的映射数组
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param upName up主用户名
     * @param pushDynamicData 推送动态数据
     * @param biliConfigData 哔哩配置数据
     * @param chatType 聊天类型
     */
    makeDynamicMessageMap(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, biliConfigData: any, chatType: string, messageMap: Map<string, Map<string | number, Map<string | number, {
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
    renderDynamicCard(uid: string, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions): Promise<Buffer[] | null>;
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
     * @param biliConfigData 哔哩配置数据
     */
    sendDynamicMessage(messageMap: Map<string, Map<string | number, Map<string | number, {
        sendMode: string;
        dynamicUUid_str: string;
        dynamicType: string;
        messages: any[];
    }[]>>>, biliConfigData: {
        [key: string]: string | number | boolean | any[];
    }): Promise<void>;
    /**
     * 发送消息api
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     */
    sendMessageApi(chatId: string | number, bot_id: string | number, chatType: string, message: any): Promise<void>;
    /**
     * 随机延时
     * @param min 最小延时时间
     * @param max 最大延时时间
     */
    randomDelay(min: number, max: number): Promise<void>;
}
