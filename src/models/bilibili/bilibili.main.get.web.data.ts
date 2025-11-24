import BiliApi from '@src/models/bilibili/bilibili.main.api';
import BiliCookieManager from '@src/models/bilibili/bilibili.risk.cookie';
import { getDmImg } from '@src/models/bilibili/bilibili.risk.dm.img';
import { getWbiSign } from '@src/models/bilibili/bilibili.risk.wbi';
import axioss from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import lodash from 'lodash';
import * as tough from 'tough-cookie';
import { EventType } from 'yunzaijs';
const axios = wrapper(axioss);

export class BilibiliWebDataFetcher {
  e?: EventType;
  constructor(e?: EventType) {}

  /**通过uid获取up动态数据表*/
  async getBiliDynamicListDataByUid(uid: any) {
    const url = BiliApi.BILIBIL_API.biliDynamicInfoList;
    const bili_jct = await BiliCookieManager.checkCookieBiliTicket();
    const { cookie, mark } = await BiliCookieManager.readSyncCookie();
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

    // 根据 mark 的值计算 signCookie
    const signCookie =
      mark === 'localCk'
        ? (await BiliCookieManager.readSavedCookieItems(`${bili_jct}+${cookie}`, ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(`${bili_jct}+${cookie}`, ['SESSDATA']))
        : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));

    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };

    const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
      Cookie: mark === 'localCk' ? `${bili_jct}+${cookie}` : undefined,
      Host: `api.bilibili.com`,
      Origin: 'https://space.bilibili.com',
      Referer: `https://space.bilibili.com/${uid}/dynamic`
    });

    const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
    // (1) 保存初始状态
    let initialCookies: any;
    if (ck) {
      initialCookies = await new Promise<tough.Cookie[]>((resolve, reject) => {
        ck.store.getAllCookies((err, cookies) => {
          if (err) reject(err);
          else resolve(cookies || []);
        });
      });
    }
    const res = await axios.get(url, {
      jar: ck, // 仅在非 localCk 时传递 jar
      params,
      timeout: 15000,
      headers
    });

    // (3) 获取请求完成后的 Cookie 状态
    let updatedCookies;
    if (ck) {
      updatedCookies = await new Promise<tough.Cookie[]>((resolve, reject) => {
        ck.store.getAllCookies((err, cookies) => {
          if (err) reject(err);
          else resolve(cookies || []);
        });
      });
    }
    if (ck && initialCookies instanceof Array && updatedCookies instanceof Array) {
      // 构建初始状态的 Map
      const initialCookieMap = new Map(initialCookies.map(c => [`${c.key}:${c.domain}`, c]));
      // 构建更新后的 Map
      const updatedCookieMap = new Map(updatedCookies.map(c => [`${c.key}:${c.domain}`, c]));
      // 比较两个 Map
      for (const [key, updatedCookie] of updatedCookieMap.entries()) {
        const initialCookie = initialCookieMap.get(key);
        if (!initialCookie || initialCookie.value !== updatedCookie.value) {
          console.log(`Weibo Cookie ${updatedCookie.key} was updated.`);
          await BiliCookieManager.saveCookiesToRedis(ck); // 更新同步到 Redis
        }
      }
    }
    return res;
  }

  /**通过uid获取up详情*/
  async getBilibiUserInfoByUid(uid: any) {
    const url = BiliApi.BILIBIL_API.biliSpaceUserInfoWbi;
    const bili_jct = await BiliCookieManager.checkCookieBiliTicket();
    const { cookie, mark } = await BiliCookieManager.readSyncCookie();
    const dmImg = await getDmImg();

    const data = {
      mid: uid,
      token: '',
      platform: 'web',
      web_location: 1550101,
      ...dmImg
    };
    // 根据 mark 的值计算 signCookie
    const signCookie =
      mark === 'localCk'
        ? (await BiliCookieManager.readSavedCookieItems(`${bili_jct}+${cookie}`, ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(`${bili_jct}+${cookie}`, ['SESSDATA']))
        : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));

    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };

    const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
      Cookie: mark === 'localCk' ? `${bili_jct}+${cookie}` : undefined,
      Host: `api.bilibili.com`,
      Origin: 'https://space.bilibili.com',
      Referer: `https://space.bilibili.com/${uid}/dynamic`
    });

    const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
    const res = await axios.get(url, {
      jar: ck, // 仅在非 localCk 时传递 jar
      params,
      timeout: 15000,
      headers
    });
    return res;
  }

  /**通过关键词搜索up*/
  async searchBiliUserInfoByKeyword(keyword: string) {
    const url = BiliApi.BILIBIL_API.biliSearchUpWbi;
    const bili_jct = await BiliCookieManager.checkCookieBiliTicket();
    const { cookie, mark } = await BiliCookieManager.readSyncCookie();

    const data = {
      keyword: keyword,
      page: 1,
      search_type: 'bili_user',
      order: 'totalrank'
    };

    // 根据 mark 的值计算 signCookie
    const signCookie =
      mark === 'localCk'
        ? (await BiliCookieManager.readSavedCookieItems(`${bili_jct}+${cookie}`, ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(`${bili_jct}+${cookie}`, ['SESSDATA']))
        : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));

    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };

    const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
      Cookie: mark === 'localCk' ? `${bili_jct}+${cookie}` : undefined,
      Host: `api.bilibili.com`,
      Origin: 'https://www.bilibili.com',
      Referer: `https://www.bilibili.com/`
    });

    const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
    const res = await axios.get(url, {
      jar: ck, // 仅在非 localCk 时传递 jar
      params,
      timeout: 15000,
      headers
    });
    return res;
  }

  /*通过aid/bvid获取视频信息*/
  async getBiliVideoInfoByAid_BV(vedioID: { aid?: number; bvid?: string }) {
    const url = BiliApi.BILIBIL_API.biliVideoInfoWbi;
    const bili_jct = await BiliCookieManager.checkCookieBiliTicket();
    const { cookie, mark } = await BiliCookieManager.readSyncCookie();

    let referer = vedioID?.bvid ? `https://www.bilibili.com/video/${vedioID.bvid}` : `https://www.bilibili.com/video/av${vedioID.aid}`;
    let data = vedioID?.bvid ? { bvid: vedioID.bvid } : { aid: vedioID.aid };

    // 根据 mark 的值计算 signCookie
    const signCookie =
      mark === 'localCk'
        ? (await BiliCookieManager.readSavedCookieItems(`${bili_jct}+${cookie}`, ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(`${bili_jct}+${cookie}`, ['SESSDATA']))
        : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
          (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));

    const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
    const params = {
      ...data,
      w_rid: w_rid,
      wts: time_stamp
    };

    const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
      Cookie: mark === 'localCk' ? `${bili_jct}+${cookie}` : undefined,
      Host: `api.bilibili.com`,
      Origin: 'https://www.bilibili.com',
      Referer: referer
    });

    const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
    const res = await axios.get(url, {
      jar: ck, // 仅在非 localCk 时传递 jar
      params,
      timeout: 15000,
      headers
    });
    return res;
  }

  /*通过视频短链url获取bvid*/
  async getBVIDByShortUrl(tvUrlID: string) {
    const ShortVideoUrlApi = BiliApi.BILIBIL_API.biliShortVideoUrl;
    const url = `${ShortVideoUrlApi}${tvUrlID}`;
    const bili_jct = await BiliCookieManager.checkCookieBiliTicket();
    const { cookie, mark } = await BiliCookieManager.readSyncCookie();

    const headers = lodash.merge(BiliApi.BILIBILI_DYNAMIC_SPACE_HEADERS, {
      Cookie: mark === 'localCk' ? `${bili_jct}+${cookie}` : undefined
    });

    const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
    const res = await axios.get(url, {
      jar: ck, // 仅在非 localCk 时传递 jar
      timeout: 15000,
      headers
    });

    const htmlContent: string = await res.data;
    const htmlContentRegex = /itemprop="url"\s*content="https:\/\/www.bilibili.com\/video\/(BV[a-zA-Z0-9]+)\/">/;
    const BVID = htmlContent.match(htmlContentRegex)?.[1];
    return `${BVID}`;
  }
}
