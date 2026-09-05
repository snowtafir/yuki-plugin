import BiliApi from './bilibili.main.api.js';
import axioss from 'axios';
import lodash from 'lodash';
import BiliCookieManager from './bilibili.risk.cookie.js';
import { getDmImg } from './bilibili.risk.dm.img.js';
import { getWbiSign } from './bilibili.risk.wbi.js';
import { wrapper } from 'axios-cookiejar-support';
import * as tough from 'tough-cookie';
import crypto from 'crypto';

const axios = wrapper(axioss);
class BilibiliWebDataFetcher {
    constructor(e) { }
    /**通过uid获取up动态数据表*/
    async getBiliDynamicListDataByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliDynamicInfoList;
        const bili_ticket = await BiliCookieManager.checkCookieBiliTicket();
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
        const signCookie = mark === 'localCk'
            ? (await BiliCookieManager.readSavedCookieItems(`${bili_ticket};${cookie}`, ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(`${bili_ticket};${cookie}`, ['SESSDATA']))
            : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined,
            Host: `api.bilibili.com`,
            Origin: 'https://space.bilibili.com',
            Referer: `https://space.bilibili.com/${uid}/dynamic`
        });
        const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
        // (1) 保存初始状态
        let initialCookies;
        if (ck) {
            initialCookies = await new Promise((resolve, reject) => {
                ck.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
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
            updatedCookies = await new Promise((resolve, reject) => {
                ck.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
        }
        if (initialCookies instanceof Array && updatedCookies instanceof Array) {
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
    async getBilibiUserInfoByUid(uid) {
        const url = BiliApi.BILIBIL_API.biliSpaceUserInfoWbi;
        const bili_ticket = await BiliCookieManager.checkCookieBiliTicket();
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
        const signCookie = mark === 'localCk'
            ? (await BiliCookieManager.readSavedCookieItems(`${bili_ticket};${cookie}`, ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(`${bili_ticket};${cookie}`, ['SESSDATA']))
            : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined,
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
    async searchBiliUserInfoByKeyword(keyword) {
        const url = BiliApi.BILIBIL_API.biliSearchUpWbi;
        const bili_ticket = await BiliCookieManager.checkCookieBiliTicket();
        const { cookie, mark } = await BiliCookieManager.readSyncCookie();
        const data = {
            keyword: keyword,
            page: 1,
            search_type: 'bili_user',
            order: 'totalrank'
        };
        // 根据 mark 的值计算 signCookie
        const signCookie = mark === 'localCk'
            ? (await BiliCookieManager.readSavedCookieItems(`${bili_ticket};${cookie}`, ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(`${bili_ticket};${cookie}`, ['SESSDATA']))
            : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined,
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
    async getBiliVideoInfoByAid_BV(vedioID) {
        const url = BiliApi.BILIBIL_API.biliVideoInfoWbi;
        const bili_ticket = await BiliCookieManager.checkCookieBiliTicket();
        const { cookie, mark } = await BiliCookieManager.readSyncCookie();
        let referer = vedioID?.bvid ? `https://www.bilibili.com/video/${vedioID.bvid}` : `https://www.bilibili.com/video/av${vedioID.aid}`;
        let data = vedioID?.bvid ? { bvid: vedioID.bvid } : { aid: vedioID.aid };
        // 根据 mark 的值计算 signCookie
        const signCookie = mark === 'localCk'
            ? (await BiliCookieManager.readSavedCookieItems(`${bili_ticket};${cookie}`, ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(`${bili_ticket};${cookie}`, ['SESSDATA']))
            : (await BiliCookieManager.readSavedCookieItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA'], false)) ||
                (await BiliCookieManager.readSavedCookieOtherItems(await BiliCookieManager.getCookieStringForUrl(url), ['SESSDATA']));
        const { w_rid, time_stamp } = await getWbiSign(data, BiliApi.BILIBILI_HEADERS, signCookie);
        const params = {
            ...data,
            w_rid: w_rid,
            wts: time_stamp
        };
        const headers = lodash.merge(BiliApi.BILIBILI_HEADERS, {
            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined,
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
    async getBVIDByShortUrl(tvUrlID) {
        const ShortVideoUrlApi = BiliApi.BILIBIL_API.biliShortVideoUrl;
        const url = `${ShortVideoUrlApi}${tvUrlID}`;
        const bili_ticket = await BiliCookieManager.checkCookieBiliTicket();
        const { cookie, mark } = await BiliCookieManager.readSyncCookie();
        const headers = lodash.merge(BiliApi.BILIBILI_DYNAMIC_SPACE_HEADERS, {
            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined
        });
        const ck = cookie instanceof tough.CookieJar ? cookie : undefined;
        const res = await axios.get(url, {
            jar: ck, // 仅在非 localCk 时传递 jar
            timeout: 15000,
            headers
        });
        if (res.status === 200) {
            const htmlContent = await res.data;
            const htmlContentRegex = /property="og:url"\s*content="https:\/\/www.bilibili.com\/video\/(BV[a-zA-Z0-9]+)\/">/;
            const BVID = htmlContent.match(htmlContentRegex)?.[1];
            if (BVID) {
                logger.info(`哔哩视频解析：status 200 解析短链成功，BVID: ${BVID}`);
                return `${BVID}`;
            }
            else {
                logger.error('哔哩视频解析：status 200 正则不匹配，无法获取BVID');
                return false;
            }
        }
        else if (res.status === 302) {
            const locationHeader = res.headers['location'];
            const bvidRegex = /\/video\/(BV[a-zA-Z0-9]+)/;
            const bvidMatch = locationHeader?.match(bvidRegex)?.[1];
            if (bvidMatch) {
                logger.info(`哔哩视频解析：status 302 解析短链成功，BVID: ${bvidMatch}`);
                return `${bvidMatch}`;
            }
            else {
                logger.error('哔哩视频解析：status 302 正则不匹配，无法获取BVID');
                return false;
            }
        }
        else if (res.status === 412) {
            const X_BILI_SEC_TOKEN = res.headers['set-cookie']
                ?.find(c => c.includes('X-BILI-SEC-TOKEN='))
                ?.split(';')[0]
                .split('=')[1];
            let decodedResult = null; // 显式设为可空
            if (X_BILI_SEC_TOKEN) {
                const base64_text = X_BILI_SEC_TOKEN.split('.')[1];
                const decoded = Buffer.from(base64_text + '==', 'base64').toString('utf8');
                const obj = JSON.parse(decoded); //{"q":"xxxxx","r":"xxxxx","ip":"xx.xx.xx.xx","fp":"xxx","verity":0,"type":"1","exp":1788276102,"iat":1788272502}
                const limit = 0x4c4b40;
                for (let i = 0; i < limit; i++) {
                    const hash = crypto
                        .createHash('sha256')
                        .update(obj.q + String(i))
                        .digest('hex');
                    if (hash === obj.r) {
                        decodedResult = i;
                        break; // 找到后立即跳出循环，节省时间
                    }
                }
                // 只有找到了结果才发送请求
                if (decodedResult !== null) {
                    const capchaCheckRes = await axios.post(BiliApi.BILIBIL_API.biliCapchaCheck, { token: X_BILI_SEC_TOKEN, result: decodedResult }, { headers: BiliApi.BILIBILI_CAPTCHA_CHECK_HEADERS });
                    const capchaCheckResData = capchaCheckRes.data;
                    if (capchaCheckResData.code === 0) {
                        const afterCapchaCheckHeaders = lodash.merge(BiliApi.BILIBILI_DYNAMIC_SPACE_HEADERS, {
                            Cookie: mark === 'localCk' ? `${bili_ticket};${cookie}` : undefined
                        }, {
                            Cookie: `X-BILI-SEC-TOKEN=${capchaCheckResData.message}`
                        });
                        const res = await axios.get(url, {
                            jar: ck, // 仅在非 localCk 时传递 jar
                            timeout: 15000,
                            headers: afterCapchaCheckHeaders
                        });
                        if (res.status === 200) {
                            const htmlContent = await res.data;
                            const htmlContentRegex = /property="og:url"\s*content="https:\/\/www.bilibili.com\/video\/(BV[a-zA-Z0-9]+)\/">/;
                            const BVID = htmlContent.match(htmlContentRegex)?.[1];
                            if (BVID) {
                                logger.info(`哔哩视频解析：status 412-200 解析短链成功，BVID: ${BVID}`);
                                return `${BVID}`;
                            }
                            else {
                                logger.error('哔哩视频解析：status 412-200 正则不匹配，无法获取BVID');
                                return false;
                            }
                        }
                        else if (res.status === 302) {
                            const locationHeader = res.headers['location'];
                            const bvidRegex = /\/video\/(BV[a-zA-Z0-9]+)/;
                            const bvidMatch = locationHeader?.match(bvidRegex)?.[1];
                            if (bvidMatch) {
                                logger.info(`哔哩视频解析：status 412-302 解析短链成功，BVID: ${bvidMatch}`);
                                return `${bvidMatch}`;
                            }
                            else {
                                logger.error('哔哩视频解析：status 412-302 正则不匹配，无法获取BVID');
                                return false;
                            }
                        }
                        else {
                            logger.error('哔哩视频解析：解风控失败，短链解析失败，无法获取BVID');
                            return false;
                        }
                    }
                    else if (capchaCheckResData.code === -1) {
                        logger.error('哔哩视频解析：解风控失败，风控方法可能已更新');
                        return false;
                    }
                }
                else {
                    logger.error('哔哩视频解析：解风控失败，未找到匹配的验证码值');
                    return false;
                }
            }
            else {
                logger.error('哔哩视频解析：遭遇风控或意外，短链解析失败，无法获取BVID');
                return false;
            }
        }
    }
}

export { BilibiliWebDataFetcher };
