import axios from 'axios';
import lodash from 'lodash';
import { BiliApi } from '@src/models/bilibili//bilibili.api';
import { cookieWithBiliTicket, readSavedCookieItems, readSavedCookieOtherItems, readSyncCookie } from '@src/models/bilibili/bilibili.models';
import { getWbiSign } from '@src/models/bilibili//bilibili.wbi';
import { getDmImg } from '@src/models/bilibili/bilibili.dm.img';

export class BiliGetWebData {
  constructor(e?) {}

  /**通过uid获取up动态数据表*/
  async getBiliDynamicListDataByUid(uid: any) {
    const url = BiliApi.BILIBIL_API.biliDynamicInfoList;
    let { cookie } = await readSyncCookie();
    cookie = await cookieWithBiliTicket(cookie);
    const dmImg = await getDmImg();

    const data = {
      'offset': '',
      'host_mid': uid,
      'timezone_offset': -480,
      'platform': 'web',
      'features': 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote',
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

  /**通过uid获取up详情*/
  async getBilibiUserInfoByUid(uid: any) {
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

  /**通过关键词搜索up*/
  async searchBiliUserInfoByKeyword(keyword: string) {
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
