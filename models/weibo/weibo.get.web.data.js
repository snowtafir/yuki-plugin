import axios from 'axios';
import { WeiboApi } from './weibo.api.js';
import { WeiboQuery } from './weibo.query.js';

class WeiboGetWebData {
    e;
    constructor(e) {
    }
    async getBloggerInfo(target) {
        const param = { containerid: '100505' + target };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(param).toString();
        const resp = await axios.get(url.toString(), {
            timeout: 10000,
            headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://m.weibo.cn' },
        });
        return resp;
    }
    async searchBloggerInfo(keyword) {
        const url = WeiboApi.WEIBO_API.weiboAjaxSearch;
        const params = {
            q: keyword,
        };
        const resp = await axios.get(url, {
            params,
            timeout: 10000,
            headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'referer': 'https://s.weibo.com' },
        });
        return resp;
    }
    async getBloggerDynamicList(target) {
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
        }
        catch (error) {
            (logger ?? Bot.logger)?.mark('微博推送：Error fetching sub list:', error);
            return [];
        }
    }
}

export { WeiboGetWebData };
