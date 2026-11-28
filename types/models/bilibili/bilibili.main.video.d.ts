import { BilibiliWebDataFetcher } from '@/models/bilibili/bilibili.main.get.web.data';
export declare class BiliVideo {
    private readonly fetcher;
    constructor(fetcher?: BilibiliWebDataFetcher);
    static formatNumber(num: number): string;
    static formatDuration(seconds: number): string;
    renderCard(data: any, config: any): Promise<Buffer[]>;
    private buildRenderData;
    private buildScreenshotOptions;
}
