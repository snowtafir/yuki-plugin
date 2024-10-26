import axios from 'axios';
import lodash from 'lodash';
import { Redis } from 'yunzaijs';
import BiliApi from '@src/models/bilibili/bilibili.main.api';
import { cookieWithBiliTicket, readSyncCookie } from '@src/models/bilibili/bilibili.main.models';

export async function getWebId(uid?: number) {
  const w_webid_key = 'Yz:yuki:bili:w_webid';
  const w_webid = await Redis.get(w_webid_key);
  if (w_webid) {
    return String(w_webid);
  } else {
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
    const htmlContent: string = await res.data;
    const htmlContentRegex = /="__RENDER_DATA__"\s*type="application\/json">(.*?)<\/script>/;
    const __RENDER_DATA__ = htmlContent.match(htmlContentRegex);

    if (__RENDER_DATA__ && __RENDER_DATA__[1]) {
      const decoded__RENDER_DATA__JsonString = decodeURIComponent(__RENDER_DATA__[1]);
      const accessIdRegex = /"access_id":"(.*?)"/;
      const access_id = decoded__RENDER_DATA__JsonString.match(accessIdRegex);
      if (access_id && access_id[1]) {
        await Redis.set(w_webid_key, access_id[1], { EX: 43197 * 1000 });
        return String(access_id[1]);
      } else {
        console.error('Failed to get access_id from __RENDER_DATA__');
        return null;
      }
    }
  }
}
