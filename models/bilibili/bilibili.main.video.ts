import type { VideoPageProps } from '@/components/video/VideoPage';
import { BilibiliWebDataFetcher } from '@/models/bilibili/bilibili.main.get.web.data';
import { renderPage } from '@/utils/image';
import type { ScreenshotOptions } from '@/utils/puppeteer.render';
import moment from 'moment';
import QRCode from 'qrcode';

export class BiliVideo {
  constructor(private readonly fetcher: BilibiliWebDataFetcher = new BilibiliWebDataFetcher()) {}

  static formatNumber(num: number): string {
    const value = Number(num) || 0;
    const format = (divisor: number, unit: string) => `${(value / divisor).toFixed(1).replace(/\.0$/, '')}${unit}`;

    if (value >= 100000000) return format(100000000, '亿');
    if (value >= 10000) return format(10000, '万');
    return value.toString();
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const mm = minutes.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');

    return `${hours}:${mm}:${ss}`;
  }

  async renderCard(data: any, config: any): Promise<Buffer[]> {
    const comments = data?.aid ? await this.fetcher.getBiliVideoHotComments(data.aid, 3) : [];
    const videoUrl = `https://www.bilibili.com/video/${data?.bvid}`;
    const urlImgData = await QRCode.toDataURL(videoUrl);
    const renderData = this.buildRenderData(data, urlImgData, comments);
    const screenshotOptions = this.buildScreenshotOptions(config);
    const imageResult = await renderPage(`video-${data?.aid}-${Date.now()}`, 'VideoPage', renderData, screenshotOptions);

    if (imageResult === false || !imageResult.img.length) {
      throw new Error('视频卡片渲染失败');
    }

    return imageResult.img;
  }

  private buildRenderData(data: any, urlImgData: string, comments: VideoPageProps['data']['comments']): VideoPageProps {
    return {
      data: {
        appName: 'bilibili',
        face: data?.owner?.face,
        pendant: data?.owner?.pendant,
        name: data?.owner?.name,
        pubTs: moment(data?.pubdate * 1000).format('YYYY年MM月DD日 HH:mm:ss'),
        category: '视频解析',
        title: data?.title || '未命名视频',
        cover: data?.pic,
        bvid: data?.bvid || '',
        tname: data?.tname_v2 && data?.tname && data.tname_v2 !== data.tname ? `${data.tname_v2} · ${data.tname}` : data?.tname || '未分区',
        pubTime: `投稿 ${moment(data?.ctime * 1000).format('YYYY年MM月DD日 HH:mm:ss')} · 发布 ${moment(data?.pubdate * 1000).format('YYYY年MM月DD日 HH:mm:ss')}`,
        duration: BiliVideo.formatDuration(data?.duration),
        copyright: data?.copyright === 1 ? '原创' : '转载',
        desc: data?.desc || '',
        stats: [
          { label: '播放', value: BiliVideo.formatNumber(data?.stat?.view) },
          { label: '弹幕', value: BiliVideo.formatNumber(data?.stat?.danmaku) },
          { label: '评论', value: BiliVideo.formatNumber(data?.stat?.reply) },
          { label: '点赞', value: BiliVideo.formatNumber(data?.stat?.like) },
          { label: '投币', value: BiliVideo.formatNumber(data?.stat?.coin) },
          { label: '收藏', value: BiliVideo.formatNumber(data?.stat?.favorite) }
        ],
        comments,
        urlImgData,
        created: moment().format('YYYY年MM月DD日 HH:mm:ss')
      }
    };
  }

  private buildScreenshotOptions(config: any): ScreenshotOptions {
    const isSplit = config?.isSplit !== false;

    return {
      addStyle: isSplit ? '' : `.unfold { max-height: ${config?.noSplitHeight ?? 7500}px; }`,
      header: { Referer: 'https://www.bilibili.com/' },
      isSplit,
      modelName: 'bilibili-video',
      SOptions: { type: 'webp', quality: 98 },
      saveHtmlfile: false,
      pageSplitHeight: config?.splitHeight || 8000,
      isPauseGif: !!config?.isPauseGif
    };
  }
}
