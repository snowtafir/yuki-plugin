import axios from 'axios';
import lodash from 'lodash';
import BiliApi from '@/models/bilibili/bilibili.main.api';
import { cookieWithBiliTicket, readSavedCookieItems, readSavedCookieOtherItems, readSyncCookie } from '@/models/bilibili/bilibili.main.models';
import { getWbiSign } from '@/models/bilibili/bilibili.risk.wbi';
import { getDmImg } from '@/models/bilibili/bilibili.risk.dm.img';

export class BilibiliWebDataFetcher {
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
    const res = await axios(url, {
      method: 'GET',
      params,
      timeout: 15000,
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
  async getBilibiUserInfoByUid(uid: any) {
    const url = BiliApi.BILIBIL_API.biliSpaceUserInfoWbi;
    let { cookie } = await readSyncCookie();
    cookie = await cookieWithBiliTicket(cookie);
    const dmImg = await getDmImg();

    const data = {
      mid: uid,
      token: '',
      platform: 'web',
      web_location: 1550101,
      ...dmImg
    };
    let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };
    const res = await axios(url, {
      method: 'GET',
      params,
      timeout: 10000,
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
    const res = await axios(url, {
      method: 'GET',
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

  /*通过aid/bvid获取视频信息*/
  async getBiliVideoInfoByAid_BV(vedioID: { aid?: number; bvid?: string }) {
    const url = BiliApi.BILIBIL_API.biliVideoInfoWbi;
    let { cookie } = await readSyncCookie();
    cookie = await cookieWithBiliTicket(cookie);
    let referer = vedioID?.bvid ? `https://www.bilibili.com/video/${vedioID.bvid}` : `https://www.bilibili.com/video/av${vedioID.aid}`;
    let data = vedioID?.bvid ? { bvid: vedioID.bvid } : { aid: vedioID.aid };

    let signCookie = (await readSavedCookieItems(cookie, ['SESSDATA'], false)) || (await readSavedCookieOtherItems(cookie, ['SESSDATA']));
    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };
    const res = await axios(url, {
      method: 'GET',
      params,
      timeout: 5000,
      headers: lodash.merge(BiliApi.BILIBILI_HEADERS, {
        Cookie: `${cookie}`,
        Host: `api.bilibili.com`,
        Origin: 'https://www.bilibili.com',
        Referer: referer
      })
    });
    return res;
  }

  /*通过视频短链url获取bvid*/
  async getBVIDByShortUrl(tvUrlID: string) {
    const ShortVideoUrlApi = BiliApi.BILIBIL_API.biliShortVideoUrl;
    const url = `${ShortVideoUrlApi}${tvUrlID}`;
    let { cookie } = await readSyncCookie();
    cookie = await cookieWithBiliTicket(cookie);
    const res = await axios(url, {
      method: 'GET',
      timeout: 5000,
      headers: lodash.merge(BiliApi.BILIBILI_DYNAMIC_SPACE_HEADERS, {
        Cookie: `${cookie}`
      })
    });
    const htmlContent: string = await res.data;
    const htmlContentRegex = /itemprop="url"\s*content="https:\/\/www.bilibili.com\/video\/(BV[a-zA-Z0-9]+)\/">/;
    const BVID = htmlContent.match(htmlContentRegex)?.[1];
    return `${BVID}`;
  }
}
