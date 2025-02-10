import axios from 'axios';
import lodash from 'lodash';
import https from 'https';
import BiliApi from './bilibili.main.api.js';
import { readSyncCookie, cookieWithBiliTicket, readSavedCookieItems, readSavedCookieOtherItems } from './bilibili.mian.models.js';
import { getWbiSign } from './bilibili.risk.wbi.js';
import { getDmImg } from './bilibili.risk.dm.img.js';
import { getWebId } from './bilibili.risk.w_webid.js';

class BiliHttpClient {
    client;
    constructor() {
        this.client = this.initializeClient();
    }
    initializeClient() {
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
    async request(url, config) {
        try {
            const response = await this.client.request({ url, ...config });
            return response;
        }
        catch (error) {
            console.error('BiliHttpClient Request failed:', error);
            // 重新创建 AxiosInstance
            this.client = this.initializeClient();
        }
    }
}
class BilibiliWebDataFetcher extends BiliHttpClient {
    constructor(e) {
        super();
    }
    /**通过uid获取up动态数据表*/
    async getBiliDynamicListDataByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliDynamicInfoList;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const dmImg = await getDmImg();
        const data = {
            'offset': '',
            'host_mid': uid,
            'timezone_offset': -480,
            'platform': 'web',
            'features': 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote,decorationCard,forwardListHidden,ugcDelete,onlyfansQaCard',
            'web_location': '333.999',
            ...dmImg,
            'x-bili-device-req-json': { platform: 'web', device: 'pc' },
            'x-bili-web-req-json': { spm_id: '333.999' }
        };
        let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const res = await this.request(url, {
            method: 'GET',
            params,
            timeout: 20000,
            headers: lodash.merge(BiliApi.BILIBILI_HEADERS, {
                Cookie: `${cookie}`,
                Host: `api.bilibili.com`,
                Origin: 'https://space.bilibili.com',
                Referer: `https://space.bilibili.com/${uid}/dynamic`
            })
        });
        return res;
    }
    /**通过uid获取up详情*/
    async getBilibiUserInfoByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliSpaceUserInfoWbi;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const dmImg = await getDmImg();
        const w_webid = await getWebId(uid);
        const data = {
            mid: uid,
            token: '',
            platform: 'web',
            web_location: 1550101,
            ...dmImg,
            w_webid: w_webid
        };
        let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const res = await this.request(url, {
            method: 'GET',
            params,
            timeout: 5000,
            headers: lodash.merge(BiliApi.BILIBILI_HEADERS, {
                Cookie: `${cookie}`,
                Host: `api.bilibili.com`,
                Origin: 'https://space.bilibili.com',
                Referer: `https://space.bilibili.com/${uid}/dynamic`
            })
        });
        return res;
    }
    /**通过关键词搜索up*/
    async searchBiliUserInfoByKeyword(keyword) {
        const url = BiliApi.BILIBIL_API.biliSearchUpWbi;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const data = {
            keyword: keyword,
            page: 1,
            search_type: 'bili_user',
            order: 'totalrank'
        };
        let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const res = await this.request(url, {
            method: 'GET',
            params,
            timeout: 5000,
            headers: lodash.merge(BiliApi.BILIBILI_HEADERS, {
                Cookie: `${cookie}`,
                Host: `api.bilibili.com`,
                Origin: 'https://www.bilibili.com',
                Referer: `https://www.bilibili.com/`
            })
        });
        return res;
    }
}

export { BilibiliWebDataFetcher };
