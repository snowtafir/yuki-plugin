import axios from "axios";
import { WeiboApi } from '@/models/weibo/weibo.api';
import { WeiboQuery } from "@/models/weibo/weibo.query";

declare const logger: any, Bot: any;


export class WeiboGetWebData {
  e?: any;
  constructor(e?: any) {
  }

  /**通过uid获取博主信息 */
  async getBloggerInfo(target: any) {
    const param = { containerid: '100505' + target };
    const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
    url.search = new URLSearchParams(param).toString();

    const resp = await axios.get(url.toString(), {
      timeout: 10000,
      headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://m.weibo.cn' },
    });
    return resp;
  }

  /**通过关键词搜索微博大v */
  async searchBloggerInfo(keyword: string) {
    const url = WeiboApi.WEIBO_API.weiboAjaxSearch;

    const params = {
      q: keyword,
    }

    const resp = await axios.get(url, {
      params,
      timeout: 10000,
      headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://s.weibo.com' },
    })
    return resp;
  }

  /**获取主页动态资源相关数组 */
  async getBloggerDynamicList(target: any) {
    const params = { containerid: '107603' + target };
    const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
    url.search = new URLSearchParams(params).toString();

    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (6500 - 1000 + 1) + 1000)));

    try {
      const response = await axios.get(url.toString(), {
        timeout: 15000,
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://m.weibo.cn' },
      });
      const { ok, data, msg } = response.data;

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
