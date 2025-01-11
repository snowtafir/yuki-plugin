import axios from 'axios';
import lodash from 'lodash';
import BiliApi from './bilibili.main.api.js';
import { readSyncCookie, cookieWithBiliTicket } from './bilibili.main.models.js';

async function getWebId(uid) {
    const w_webid_key = 'Yz:yuki:bili:w_webid';
    const w_webid = await redis.get(w_webid_key);
    const keyTTL = await redis.ttl(w_webid_key);
    if (w_webid && keyTTL < 259200) {
        return String(w_webid);
    }
    else {
        const url = `https://space.bilibili.com/${uid ? uid : 401742377}/dynamic`;
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        const res = await axios.get(url, {
            timeout: 8000,
            headers: lodash.merge(BiliApi.BILIBILI_DYNAMIC_SPACE_HEADERS, {
                Cookie: `${cookie}`,
                Host: `space.bilibili.com`
            })
        });
        const htmlContent = await res.data;
        const htmlContentRegex = /="__RENDER_DATA__"\s*type="application\/json">(.*?)<\/script>/;
        const __RENDER_DATA__ = htmlContent.match(htmlContentRegex);
        if (__RENDER_DATA__ && __RENDER_DATA__[1]) {
            const decoded__RENDER_DATA__JsonString = decodeURIComponent(__RENDER_DATA__[1]);
            const accessIdRegex = /"access_id":"(.*?)"/;
            const access_id = decoded__RENDER_DATA__JsonString.match(accessIdRegex);
            const ExpirationTimeRegex = /document.getElementById\("__RENDER_DATA__"\).*?setTimeout\(function\(\)\s*{window.location.reload\(true\);},\s*(\d+)\s*\*\s*(\d+)\);<\/script>/;
            const ExpirationTime = htmlContent.match(ExpirationTimeRegex);
            if (access_id && access_id[1] && ExpirationTime && ExpirationTime[1]) {
                await redis.set(w_webid_key, access_id[1], { EX: Number(ExpirationTime[1]) });
                return String(access_id[1]);
            }
            else {
                console.error('Failed to get access_id from __RENDER_DATA__');
                return null;
            }
        }
    }
}

export { getWebId };
