import { MainProps } from '@/components/dynamic/MainPage';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
export declare class WeiboTask {
    taskName: string;
    groupKey: string;
    privateKey: string;
    e?: any;
    constructor(e?: any);
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
    }, uidMap: Map<any, Map<string, any>>, dynamicList: any): Promise<void>;
    /**
     * 推送动态消息
     * @param uidMap uid 映射
     * @param dynamicList 动态列表
     * @param now 当前时间戳
     * @param interval 推送间隔时间
     * @param weiboConfigData 微博配置数据
     */
    pushDynamicMessages(uidMap: Map<any, Map<string, any>>, dynamicList: any, now: number, interval: number, weiboConfigData: any): Promise<void>;
    /**
     * 发送动态消息
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param upName 用户名
     * @param pushDynamicData 推送动态数据
     * @param weiboConfigData 微博配置数据
     * @param chatType 聊天类型
     */
    sendDynamic(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, weiboConfigData: any, chatType: string): Promise<string>;
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
     * 发送消息
     * @param chatId 聊天 ID
     * @param bot_id 机器人 ID
     * @param chatType 聊天类型
     * @param message 消息内容
     */
    sendMessage(chatId: string | number, bot_id: string | number, chatType: string, message: any): Promise<void>;
    /**
     * 随机延时
     * @param min 最小延时时间
     * @param max 最大延时时间
     */
    randomDelay(min: number, max: number): Promise<void>;
}
