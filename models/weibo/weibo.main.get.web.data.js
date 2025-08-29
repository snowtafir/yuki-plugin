import axios from 'axios';
import WeiboApi from './weibo.main.api.js';
import { WeiboQuery } from './weibo.main.query.js';
import { logger } from '../../utils/host.js';
import { WeiboMainModels } from './weibo.main.models.js';
import { randomInt } from 'crypto';
import lodash from 'lodash';

function generateRandomString(length = 6) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = randomInt(0, characters.length);
        result += characters[randomIndex];
    }
    return result;
}
class WeiboWebDataFetcher {
    e;
    constructor(e) { }
    /**通过uid获取博主信息 */
    async getBloggerInfo(target) {
        const param = { containerid: '100505' + target };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(param).toString();
        const { cookie, mark } = await WeiboMainModels.readSyncCookie();
        let COOKIE = '', XSRF_TOKEN = '';
        if (String(cookie).includes('XSRF-TOKEN')) {
            COOKIE = cookie;
            XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(cookie, ['XSRF-TOKEN'], false);
        }
        else {
            logger.warn(`优纪插件：获取博主信息，未登录，如获取报错或失败请先 #扫码微博登录`);
            XSRF_TOKEN = generateRandomString();
            COOKIE = `XSRF_TOKEN=${XSRF_TOKEN}`;
        }
        const resp = await axios(url.toString(), {
            method: 'GET',
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_HEADERS, { 'X-XSRF-TOKEN': `${XSRF_TOKEN}`, 'Cookie': `${COOKIE}`, 'referer': 'https://m.weibo.cn' })
        });
        // 处理 Set-Cookie 响应头
        if (resp.headers['set-cookie']) {
            await WeiboMainModels.updateCookieWithSetCookie(resp.headers['set-cookie'], mark);
        }
        return resp;
    }
    /**通过关键词搜索微博大v */
    async searchBloggerInfo(keyword) {
        const url = WeiboApi.WEIBO_API.weiboAjaxSearch;
        const { cookie, mark } = await WeiboMainModels.readSyncCookie();
        let COOKIE = '', XSRF_TOKEN = '';
        const params = {
            q: keyword
        };
        if (String(cookie).includes('XSRF-TOKEN')) {
            COOKIE = cookie;
            XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(cookie, ['XSRF-TOKEN'], false);
        }
        else {
            logger.warn(`优纪插件：搜索微博大V，未登录，如获取报错或失败请先 #扫码微博登录`);
            XSRF_TOKEN = generateRandomString();
            COOKIE = `XSRF_TOKEN=${XSRF_TOKEN}`;
        }
        const resp = await axios(url, {
            method: 'GET',
            params,
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_HEADERS, { 'X-XSRF-TOKEN': `${XSRF_TOKEN}`, 'Cookie': `${COOKIE}`, 'referer': 'https://m.weibo.cn' })
        });
        // 处理 Set-Cookie 响应头
        if (resp.headers['set-cookie']) {
            await WeiboMainModels.updateCookieWithSetCookie(resp.headers['set-cookie'], mark);
        }
        return resp;
    }
    /**获取主页动态资源相关数组 */
    async getBloggerDynamicList(target) {
        const params = { containerid: '107603' + target };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(params).toString();
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (6500 - 1000 + 1) + 1000)));
        const { cookie, mark } = await WeiboMainModels.readSyncCookie();
        let COOKIE = '', XSRF_TOKEN = '';
        if (String(cookie).includes('XSRF-TOKEN')) {
            COOKIE = cookie;
            XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(cookie, ['XSRF-TOKEN'], false);
        }
        else {
            logger.warn(`优纪插件：获取主页动态资源，未登录，如获取报错或失败请先 #扫码微博登录`);
            XSRF_TOKEN = generateRandomString();
            COOKIE = `XSRF_TOKEN=${XSRF_TOKEN}`;
        }
        try {
            const response = await axios(url.toString(), {
                method: 'GET',
                timeout: 10000,
                headers: lodash.merge(WeiboApi.WEIBO_HEADERS, { 'X-XSRF-TOKEN': `${XSRF_TOKEN}`, 'Cookie': `${COOKIE}`, 'referer': 'https://m.weibo.cn' })
            });
            // 处理 Set-Cookie 响应头
            if (response.headers['set-cookie']) {
                await WeiboMainModels.updateCookieWithSetCookie(response.headers['set-cookie'], mark);
            }
            const { ok, data, msg } = response?.data;
            if (!ok && msg !== '这里还没有内容') {
                throw new Error(response?.config.url);
            }
            return data.cards.filter(WeiboQuery.filterCardTypeCustom);
        }
        catch (error) {
            global?.logger?.mark('微博推送：Error fetching sub list:', error);
            return [];
        }
    }
}

export { WeiboWebDataFetcher };
