import axios from 'axios';
import lodash from 'lodash';
import { BiliApi } from './bilibili.api.js';
import { readSyncCookie, cookieWithBiliTicket, readSavedCookieItems, readSavedCookieOtherItems } from './bilibili.models.js';
import { getWbiSign } from './bilibili.wbi.js';

class BiliGetWebData {
    constructor(e) { }
    async getBiliDynamicListDataByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliDynamicInfoList;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const data = {
            'offset': '',
            'host_mid': uid,
            'timezone_offset': -480,
            'platform': 'web',
            'features': 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote',
            'web_location': '333.999',
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
        const res = await axios.get(url, {
            params,
            timeout: 10000,
            headers: lodash.merge(BiliApi.BILIBILI_HEADERS, {
                Cookie: `${cookie}`,
                Host: `api.bilibili.com`,
                Origin: 'https://www.bilibili.com',
                Referer: `https://www.bilibili.com/`
            })
        });
        return res;
    }
    async getBilibiUserInfoByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliSpaceUserInfoWbi;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const data = {
            mid: uid,
            jsonp: 'jsonp'
        };
        let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const res = await axios.get(url, {
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
        const res = await axios.get(url, {
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

export { BiliGetWebData };
