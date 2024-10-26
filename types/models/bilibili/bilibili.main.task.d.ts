import { MainProps } from '@/components/dynamic/MainPage';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
export declare class BiliTask {
    taskName: string;
    groupKey: string;
    privateKey: string;
    e?: any;
    constructor(e?: any);
    hendleEventDynamicData(uid: string | number, count?: number): Promise<any>;
    runTask(): Promise<void>;
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
    pushDynamicMessages(uidMap: Map<any, Map<string, any>>, dynamicList: any, now: number, interval: number, biliConfigData: any): Promise<void>;
    sendDynamic(chatId: string | number, bot_id: string | number, upName: string, pushDynamicData: any, biliConfigData: any, chatType: string): Promise<string>;
    buildRenderData(extentData: any, urlQrcodeData: string, boxGrid: boolean): MainProps;
    renderDynamicCard(uid: string, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions): Promise<Buffer[] | null>;
    sendMessage(chatId: string | number, bot_id: string | number, chatType: string, message: any): Promise<void>;
    randomDelay(min: number, max: number): Promise<void>;
}
