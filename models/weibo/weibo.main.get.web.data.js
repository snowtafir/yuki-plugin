import WeiboApi from './weibo.main.api.js';
import { WeiboQuery } from './weibo.main.query.js';
import WeiboCookieManager from './weibo.risk.cookie.js';
import { logger } from '../../utils/host.js';
import axioss from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import lodash from 'lodash';

const axios = wrapper(axioss);
class WeiboWebDataFetcher {
    e;
    constructor(e) { }
    /**通过uid获取博主信息 */
    async getBloggerInfo(uid) {
        const param = { type: 'uid', value: `${uid}`, containerid: '100505' + `${uid}` };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(param).toString();
        const jar = await WeiboCookieManager.getSessionCookieJar();
        const X_XSRF_TOKEN = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url.toString());
        // (1) 保存初始状态
        const initialCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err)
                    reject(err);
                else
                    resolve(cookies || []);
            });
        });
        const resp = await axios(url.toString(), {
            method: 'GET',
            jar,
            withCredentials: true,
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
                'Host': 'm.weibo.cn',
                'X-XSRF-TOKEN': `${X_XSRF_TOKEN}`,
                'Referer': `https://m.weibo.cn/u/${uid}`
            }),
            responseType: 'json'
        });
        // (3) 获取请求完成后的 Cookie 状态
        const updatedCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err)
                    reject(err);
                else
                    resolve(cookies || []);
            });
        });
        // 构建初始状态的 Map
        const initialCookieMap = new Map(initialCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 构建更新后的 Map
        const updatedCookieMap = new Map(updatedCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 比较两个 Map
        for (const [key, updatedCookie] of updatedCookieMap.entries()) {
            const initialCookie = initialCookieMap.get(key);
            if (!initialCookie || initialCookie.value !== updatedCookie.value) {
                console.log(`Weibo Cookie ${updatedCookie.key} was updated.`);
                await WeiboCookieManager.saveCookiesToRedis(jar); // 更新同步到 Redis
            }
        }
        return resp;
    }
    /**通过关键词搜索微博大v */
    async searchBloggerInfo(keyword) {
        const params = { containerid: '100103', type: '1', q: `${keyword}`, page_type: 'searchall' };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(params).toString();
        const jar = await WeiboCookieManager.getSessionCookieJar();
        const X_XSRF_TOKEN = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url.toString());
        // (1) 保存初始状态
        const initialCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err)
                    reject(err);
                else
                    resolve(cookies || []);
            });
        });
        const resp = await axios(url.toString(), {
            method: 'GET',
            jar,
            withCredentials: true,
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
                'X-XSRF-TOKEN': `${X_XSRF_TOKEN}`,
                'Referer': 'https://m.weibo.cn/search?'
            }),
            responseType: 'json'
        });
        // (3) 获取请求完成后的 Cookie 状态
        const updatedCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err)
                    reject(err);
                else
                    resolve(cookies || []);
            });
        });
        // 构建初始状态的 Map
        const initialCookieMap = new Map(initialCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 构建更新后的 Map
        const updatedCookieMap = new Map(updatedCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 比较两个 Map
        for (const [key, updatedCookie] of updatedCookieMap.entries()) {
            const initialCookie = initialCookieMap.get(key);
            if (!initialCookie || initialCookie.value !== updatedCookie.value) {
                console.log(`Weibo Cookie ${updatedCookie.key} was updated.`);
                await WeiboCookieManager.saveCookiesToRedis(jar); // 更新同步到 Redis
            }
        }
        return resp;
    }
    /**获取主页动态资源相关数组 */
    async getBloggerDynamicList(uid) {
        const params = { containerid: '107603' + uid };
        const url = new URL(WeiboApi.WEIBO_API.weiboGetIndex);
        url.search = new URLSearchParams(params).toString();
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (6500 - 1000 + 1) + 1000)));
        const jar = await WeiboCookieManager.getSessionCookieJar();
        const X_XSRF_TOKEN = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url.toString());
        // (1) 保存初始状态
        const initialCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err)
                    reject(err);
                else
                    resolve(cookies || []);
            });
        });
        try {
            const response = await axios(url.toString(), {
                method: 'GET',
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
                    'Host': 'm.weibo.cn',
                    'X-XSRF-TOKEN': `${X_XSRF_TOKEN}`,
                    'referer': `https://m.weibo.cn/u/${uid}`
                }),
                responseType: 'json'
            });
            const { ok, data, msg } = response?.data;
            if (!ok && msg !== '这里还没有内容') {
                throw new Error(response?.config.url);
            }
            // (3) 获取请求完成后的 Cookie 状态
            const updatedCookies = await new Promise((resolve, reject) => {
                jar.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
            // 构建初始状态的 Map
            const initialCookieMap = new Map(initialCookies.map(c => [`${c.key}:${c.domain}`, c]));
            // 构建更新后的 Map
            const updatedCookieMap = new Map(updatedCookies.map(c => [`${c.key}:${c.domain}`, c]));
            // 比较两个 Map
            for (const [key, updatedCookie] of updatedCookieMap.entries()) {
                const initialCookie = initialCookieMap.get(key);
                if (!initialCookie || initialCookie.value !== updatedCookie.value) {
                    console.log(`Weibo Cookie ${updatedCookie.key} was updated.`);
                    await WeiboCookieManager.saveCookiesToRedis(jar); // 更新同步到 Redis
                }
            }
            return data?.cards.filter(WeiboQuery.filterCardTypeCustom);
        }
        catch (error) {
            logger?.mark('微博推送：Error fetching sub list:', error);
            return [];
        }
    }
}

export { WeiboWebDataFetcher };
