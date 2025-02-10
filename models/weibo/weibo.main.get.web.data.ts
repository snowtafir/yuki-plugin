import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import { WeiboApi } from '@/models/weibo/weibo.main.api';
import { WeiboQuery } from '@/models/weibo/weibo.main.query';

declare const logger: any, Bot: any;

class WeiboHttpClient {
  client: AxiosInstance;

  constructor() {
    this.client = this.initializeClient();
  }

  private initializeClient() {
    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 100,
      timeout: 20000
    });

    const client = axios.create({
      httpsAgent: httpsAgent,
      timeout: 20000
    });
    return client;
  }

  async request(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.request({ url, ...config });
      return response;
    } catch (error) {
      console.error('WeiboHttpClient Request failed:', error);
      // 重新创建 AxiosInstance
      this.client = this.initializeClient();
    }
  }
}

export class WeiboWebDataFetcher extends WeiboHttpClient {
  e?: any;
  constructor(e?: any) {
    super();
  }

  /**通过uid获取博主信息 */
  async getBloggerInfo(target: any) {
    const param = { containerid: '100505' + target };
    const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
    url.search = new URLSearchParams(param).toString();

    const resp = await this.request(url.toString(), {
      method: 'GET',
      headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://m.weibo.cn' }
    });
    return resp;
  }

  /**通过关键词搜索微博大v */
  async searchBloggerInfo(keyword: string) {
    const url = WeiboApi.WEIBO_API.weiboAjaxSearch;

    const params = {
      q: keyword
    };

    const resp = await this.request(url, {
      method: 'GET',
      params,
      headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://s.weibo.com' }
    });
    return resp;
  }

  /**获取主页动态资源相关数组 */
  async getBloggerDynamicList(target: any) {
    const params = { containerid: '107603' + target };
    const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
    url.search = new URLSearchParams(params).toString();

    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (6500 - 1000 + 1) + 1000)));

    try {
      const response = await this.request(url.toString(), {
        method: 'GET',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://m.weibo.cn' }
      });
      const { ok, data, msg } = response?.data;

      if (!ok && msg !== '这里还没有内容') {
        throw new Error(response.config.url);
      }

      return data.cards.filter(WeiboQuery.filterCardTypeCustom);
    } catch (error) {
      (logger ?? Bot.logger)?.mark('微博推送：Error fetching sub list:', error);
      return [];
    }
  }
}
