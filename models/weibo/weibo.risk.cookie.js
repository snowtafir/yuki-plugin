import WeiboApi from './weibo.main.api.js';
import { logger, Redis, Segment } from '../../utils/host.js';
import axioss from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import crypto from 'crypto';
import lodash from 'lodash';
import fetch from 'node-fetch';
import querystring from 'querystring';
import * as tough from 'tough-cookie';

const axios = wrapper(axioss);
const START_URL = WeiboApi.WEIBO_API.weiboUserPage;
const VISITOR_ORIGIN = WeiboApi.WEIBO_API.weiboVisitorOrigin;
const VISITOR_COOKIE_MAX_AGE = 30 * 60 * 1000;
const VISITOR_COOKIE_RETRY_DELAY = 60 * 1000;
const VISITOR_COOKIE_NAMES = ['SUB', 'SUBP', 'SVB', 'SRT', 'SRF'];
class WeiboRiskCookie {
    cookieJar;
    prefix;
    initialization;
    visitorCookieRefreshPromise = null;
    visitorCookieIssuedAt = 0;
    visitorCookieRetryAt = 0;
    loginConfirmed = false;
    loginPollGeneration = 0;
    constructor() {
        this.prefix = 'Yz:yuki:weibo:cookie';
        this.cookieJar = new tough.CookieJar(null, { looseMode: true });
        this.initialization = this.initialize();
    }
    async initialize() {
        await this.ensureLongLivedCookies(this.cookieJar);
    }
    // 新增：根据步骤返回严格的请求头
    static getHeadersForStep(step, referer) {
        switch (step) {
            case 1: // GET m.weibo 页面
                return {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'priority': 'u=0, i',
                    /*           'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                              'sec-ch-ua-mobile': '?0',
                              'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            case 2: // POST enter
                return {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'priority': 'u=0, i',
                    /*           'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                              'sec-ch-ua-mobile': '?0',
                              'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            case 3: // GET mini_original.js
                return Object.assign({
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'priority': 'u=1',
                    /*             'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'script',
                    'sec-fetch-mode': 'no-cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                }, referer ? { referer: referer } : {});
            case 4: // GET 1.2.1.umd.js
                return Object.assign({
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'priority': 'u=1',
                    /*             'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'script',
                    'sec-fetch-mode': 'no-cors',
                    'sec-fetch-site': 'cross-site',
                    'sec-fetch-storage-access': 'none',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                }, referer ? { referer: referer } : {});
            case 5: // POST bd
                return {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded',
                    'origin': WeiboApi.WEIBO_API.weiboVisitorOrigin,
                    'priority': 'u=1, i',
                    'referer': `${WeiboApi.WEIBO_API.weiboVisitorOrigin}/`,
                    /*           'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                              'sec-ch-ua-mobile': '?0',
                              'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'sec-fetch-storage-access': 'none',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            case 6: // POST genvisitor2
                return {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'cache-control': 'max-age=0',
                    'content-type': 'application/x-www-form-urlencoded',
                    'if-modified-since': '0',
                    'origin': WeiboApi.WEIBO_API.weiboVisitorOrigin,
                    'priority': 'u=1, i',
                    'referer': referer || WeiboApi.WEIBO_API.weiboVisitorEnter,
                    /*           'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                              'sec-ch-ua-mobile': '?0',
                              'sec-ch-ua-platform': '"Windows"', */
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            case 7: // POST genvisitor (v1)
                return {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'origin': VISITOR_ORIGIN,
                    'referer': `${VISITOR_ORIGIN}/`,
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            case 8: // GET visitor (v1)
                return {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'referer': `${VISITOR_ORIGIN}/`,
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': `${WeiboApi.USER_AGENT}`
                };
            default:
                return {};
        }
    }
    async fetchInitialHtml(jar) {
        const res = await axios.get(START_URL, {
            jar,
            withCredentials: true,
            timeout: 10000,
            headers: WeiboRiskCookie.getHeadersForStep(1),
            responseType: 'text'
        });
        return res.data;
    }
    static extractParamsFromHtml(html) {
        const getString = (re, fallback = '') => {
            const m = html.match(re);
            return m ? m[1] : fallback;
        };
        const request_id = getString(/request_id\s*=\s*["']([\w\d]+)["']/i, '');
        const return_url = getString(/var\s+return_url\s*=\s*["']([^"']+)["']/i, START_URL);
        const ver = getString(/ver=(\d+)/i, '20250916');
        const from = getString(/var\s+from\s*=\s*["']([^"']+)["']/i, 'weibo');
        return { request_id, return_url, ver, from };
    }
    static extractTidFromJarSync(jar) {
        const cookies = jar.getCookiesSync(START_URL);
        const tidCookie = cookies.find(c => c.key === 'tid' || c.key === 'TID');
        return tidCookie ? tidCookie.value : '';
    }
    // 简单 fingerprint（可按需增强）
    static buildSimpleFingerprint() {
        return JSON.stringify({
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            platform: 'Win32',
            screen: '1920x1080x24',
            fonts: ['Arial', 'SimSun'],
            plugins: []
        });
    }
    static buildLegacyFingerprint() {
        return JSON.stringify({
            os: '1',
            browser: 'Chrome142,0,0,0',
            fonts: 'undefined',
            screenInfo: '1920*1080*24',
            plugins: 'Portable Document Format::internal-pdf-viewer::Chromium PDF Viewer::WebKit built-in PDF'
        });
    }
    // UMD 公钥 DER bytes（来自 1.2.1.umd.js 的 Uint8Array）
    static getUmdPublicKeyDer() {
        const arr = [
            48, 129, 159, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 1, 5, 0, 3, 129, 141, 0, 48, 129, 137, 2, 129, 129, 0, 180, 249, 101, 74, 227, 247, 222, 230,
            24, 220, 10, 149, 183, 131, 164, 185, 20, 166, 164, 114, 158, 71, 46, 151, 77, 71, 226, 23, 78, 67, 177, 246, 197, 249, 213, 39, 243, 55, 38, 112, 17, 64,
            135, 155, 109, 50, 185, 61, 21, 105, 106, 245, 148, 212, 127, 7, 18, 227, 255, 40, 199, 241, 65, 211, 167, 185, 232, 5, 186, 189, 245, 59, 161, 214, 48,
            160, 251, 21, 92, 187, 172, 83, 152, 11, 85, 72, 37, 137, 87, 104, 63, 39, 86, 6, 150, 84, 6, 178, 229, 220, 144, 133, 131, 212, 47, 139, 232, 185, 192,
            97, 89, 137, 170, 141, 39, 19, 85, 4, 153, 238, 75, 93, 243, 96, 206, 72, 135, 91, 2, 3, 1, 0, 1
        ];
        return Buffer.from(arr);
    }
    static derToPem(derBuf) {
        const b64 = derBuf.toString('base64');
        const lines = (b64.match(/.{1,64}/g) || []).join('\n');
        return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----\n`;
    }
    // 根据 UMD::Aa 逻辑加密并拼装 bd 的 payload（返回最终的字符串）
    async makeBdPayload(fpStr) {
        const key = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16);
        // AES-CBC 加密 fingerprint
        const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
        let enc = cipher.update(Buffer.from(fpStr, 'utf8'));
        enc = Buffer.concat([enc, cipher.final()]);
        const aesBase64 = enc.toString('base64');
        // RSA-OAEP(SHA-256) 加密 key+iv
        const pubDer = WeiboRiskCookie.getUmdPublicKeyDer();
        const pubPem = WeiboRiskCookie.derToPem(pubDer);
        const rsaPlain = Buffer.concat([key, iv]);
        const rsaCipher = crypto.publicEncrypt({
            key: pubPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, rsaPlain);
        // 拼装： inner = '01' + rsaCipher + '02' + atob(aesBase64) ; final = '01' + base64(inner)
        const prefix = Buffer.from('01', 'utf8');
        const mid = Buffer.from('02', 'utf8');
        const aesDecoded = Buffer.from(aesBase64, 'base64');
        const inner = Buffer.concat([prefix, rsaCipher, mid, aesDecoded]);
        const innerB64 = inner.toString('base64');
        const final = '01' + innerB64;
        return final;
    }
    async postFormWithJar(url, jar, dataObj, extraHeaders = {}) {
        const body = querystring.stringify(dataObj);
        const res = await axios.post(url, body, {
            jar,
            withCredentials: true,
            headers: Object.assign({
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': `${WeiboApi.USER_AGENT}`,
                'Referer': START_URL
            }, extraHeaders),
            responseType: 'text'
        });
        return res;
    }
    static parseCallbackJs(jsText, cbName = 'visitor_gray_callback') {
        let m = jsText.match(new RegExp(cbName + '\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*;?'));
        if (m) {
            try {
                return JSON.parse(m[1]);
            }
            catch (e) {
                /* fallthrough */
            }
        }
        m = jsText.match(/\{[\s\S]*\}/);
        if (m) {
            try {
                return JSON.parse(m[0]);
            }
            catch (e) { }
        }
        return null;
    }
    static hasUsableCookies(jar, url, names, minTtl = 0) {
        const now = Date.now();
        return jar.getCookiesSync(url).some(cookie => {
            if (!names.includes(cookie.key) || !cookie.value || cookie.value === 'deleted')
                return false;
            if (cookie.expires instanceof Date && cookie.expires.getTime() <= now + minTtl)
                return false;
            if (typeof cookie.maxAge === 'number' && cookie.maxAge * 1000 <= minTtl)
                return false;
            return true;
        });
    }
    hasLoginCookies(jar) {
        return [START_URL, `${WeiboApi.WEIBO_API.weiboWebOrigin}/`, `${WeiboApi.WEIBO_API.weiboPassportOrigin}/`].some(url => WeiboRiskCookie.hasUsableCookies(jar, url, ['SUP', 'SSOLoginState', 'WBPSESS', 'ALF', 'ALC']));
    }
    hasVisitorSub(jar) {
        return WeiboRiskCookie.hasUsableCookies(jar, START_URL, ['SUB'], 60 * 1000);
    }
    mergeVisitorCookies(source, target) {
        if (this.hasLoginCookies(target))
            return true;
        const cookies = source.getCookiesSync(`${VISITOR_ORIGIN}/visitor/visitor`).filter(cookie => VISITOR_COOKIE_NAMES.includes(cookie.key));
        if (!cookies.some(cookie => cookie.key === 'SUB' && cookie.value && cookie.value !== 'deleted'))
            return false;
        for (const cookie of target.getCookiesSync(START_URL)) {
            if (!VISITOR_COOKIE_NAMES.includes(cookie.key))
                continue;
            const expired = cookie.clone();
            if (!expired)
                continue;
            expired.value = '';
            expired.expires = new Date(0);
            expired.maxAge = 0;
            target.setCookieSync(expired, START_URL);
        }
        for (const cookie of cookies) {
            const cloned = cookie.clone();
            if (!cloned)
                continue;
            cloned.domain = 'weibo.cn';
            cloned.hostOnly = false;
            cloned.path = '/';
            target.setCookieSync(cloned, START_URL);
        }
        return this.hasVisitorSub(target);
    }
    async persistVisitorSession() {
        if (this.loginConfirmed || this.hasLoginCookies(this.cookieJar))
            return true;
        if (!this.hasVisitorSub(this.cookieJar))
            return false;
        this.visitorCookieIssuedAt = Date.now();
        this.visitorCookieRetryAt = 0;
        try {
            await this.saveCookiesToRedis(this.cookieJar);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[Yuki][weibo] 访客 Cookie 写入 Redis 失败: ${message}`);
        }
        return true;
    }
    async getLegacyVisitorCookieJar() {
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            const jar = new tough.CookieJar(null, { looseMode: true });
            try {
                const genRes = await axios.post(WeiboApi.WEIBO_API.weiboGenVisitorV1, querystring.stringify({ cb: 'gen_callback', fp: WeiboRiskCookie.buildLegacyFingerprint() }), {
                    jar,
                    withCredentials: true,
                    timeout: 10000,
                    headers: WeiboRiskCookie.getHeadersForStep(7),
                    responseType: 'text'
                });
                const parsed = WeiboRiskCookie.parseCallbackJs(genRes.data, 'gen_callback');
                const tid = parsed?.data?.tid;
                if (parsed?.retcode !== 20000000 || typeof tid !== 'string' || !tid) {
                    throw new Error(`genvisitor 返回异常: retcode=${parsed?.retcode ?? 'unknown'}`);
                }
                const params = new URLSearchParams({
                    a: 'incarnate',
                    t: tid,
                    w: '2',
                    c: '095',
                    gc: '',
                    cb: 'cross_domain',
                    from: 'weibo',
                    _rand: Math.random().toString().slice(2, 12)
                });
                await axios.get(`${WeiboApi.WEIBO_API.weiboVisitorEnter}?${params}`, {
                    jar,
                    withCredentials: true,
                    timeout: 10000,
                    maxRedirects: 0,
                    validateStatus: status => (status >= 200 && status < 300) || status === 302,
                    headers: WeiboRiskCookie.getHeadersForStep(8),
                    responseType: 'text'
                });
                if (!WeiboRiskCookie.hasUsableCookies(jar, WeiboApi.WEIBO_API.weiboVisitorEnter, ['SUB'])) {
                    throw new Error('visitor 响应未签发 SUB');
                }
                return jar;
            }
            catch (error) {
                lastError = error;
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`[Yuki][weibo] v1 访客 Cookie 获取失败（${attempt}/3）: ${message}`);
                if (attempt < 3)
                    await new Promise(resolve => setTimeout(resolve, attempt * 500));
            }
        }
        throw lastError instanceof Error ? lastError : new Error(String(lastError));
    }
    async ensureVisitorCookies(jar, force = false) {
        if (this.loginConfirmed || this.hasLoginCookies(jar))
            return true;
        if (this.visitorCookieRefreshPromise)
            return this.visitorCookieRefreshPromise;
        this.visitorCookieRefreshPromise = this.refreshVisitorCookies(jar, force).finally(() => {
            this.visitorCookieRefreshPromise = null;
        });
        return this.visitorCookieRefreshPromise;
    }
    async refreshVisitorCookies(jar, force) {
        if (this.loginConfirmed || this.hasLoginCookies(jar))
            return true;
        const now = Date.now();
        if (!force && this.visitorCookieIssuedAt && now - this.visitorCookieIssuedAt < VISITOR_COOKIE_MAX_AGE && this.hasVisitorSub(jar)) {
            return true;
        }
        if (!force && now < this.visitorCookieRetryAt)
            return false;
        const refreshed = await this.getNewSessionCookie();
        this.visitorCookieRetryAt = refreshed ? 0 : Date.now() + VISITOR_COOKIE_RETRY_DELAY;
        return refreshed;
    }
    async refreshVisitorCookieJar() {
        await this.initialization;
        if (this.loginConfirmed || this.hasLoginCookies(this.cookieJar)) {
            try {
                const loginState = await this.requestLoginState(this.cookieJar);
                if (loginState.data?.login === true)
                    return false;
                this.loginConfirmed = false;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`[Yuki][weibo] 登录态 432 校验失败，保留当前 Cookie: ${message}`);
                return false;
            }
        }
        return this.ensureVisitorCookies(this.cookieJar, true);
    }
    async getNewSessionCookie() {
        try {
            const jar = new tough.CookieJar();
            // 1) GET 初始页面
            const html = await this.fetchInitialHtml(jar);
            // 2) 解析页面内参数
            const { request_id, return_url, ver, from } = WeiboRiskCookie.extractParamsFromHtml(html);
            logger.info('[Yuki][weibo] parsed params:', { request_id, return_url, ver, from });
            // 3) POST 到 visitor enter（按真实流程）
            const enterUrl = WeiboApi.WEIBO_API.weiboVisitorEnter;
            const rand = Math.random().toString().slice(2, 12);
            const enterParams = {
                entry: 'sinawap',
                a: 'enter',
                url: START_URL,
                domain: '.weibo.cn',
                sudaref: '',
                ua: 'php-sso_sdk_client-0.6.36',
                _rand: rand
            };
            logger.info('[Yuki][weibo] POST enter ->', enterUrl, enterParams);
            await axios.post(enterUrl, querystring.stringify(enterParams), {
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: WeiboRiskCookie.getHeadersForStep(2),
                responseType: 'text'
            });
            // 3.1 GET mini_original.js（模拟脚本加载）
            const miniJsUrl = WeiboApi.WEIBO_API.weiboVisitorMiniJs;
            logger.info('[Yuki][weibo] GET mini_original.js ->', miniJsUrl);
            await axios.get(miniJsUrl, {
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: WeiboRiskCookie.getHeadersForStep(3, `${enterUrl}?_rand=${rand}`),
                responseType: 'text'
            });
            // 3.2 GET 1.2.1.umd.js（模拟脚本加载）
            const umdJsUrl = WeiboApi.WEIBO_API.weiboVisitorUmdJs;
            logger.info('[Yuki][weibo] GET 1.2.1.umd.js ->', umdJsUrl);
            await axios.get(umdJsUrl, {
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: WeiboRiskCookie.getHeadersForStep(4, `${WeiboApi.WEIBO_API.weiboVisitorOrigin}/`),
                responseType: 'text'
            });
            // 4) 构造指纹并向 bd 发送加密数据以获取 rid
            const fp = WeiboRiskCookie.buildSimpleFingerprint();
            const bdPayload = await this.makeBdPayload(fp);
            const bdUrl = WeiboApi.WEIBO_API.weiboBd;
            logger.info('[Yuki][weibo] POST bd ->', bdUrl);
            const bdRes = await axios.post(bdUrl, querystring.stringify({ data: bdPayload, from: 'android-visitor' }), {
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: WeiboRiskCookie.getHeadersForStep(5),
                responseType: 'text'
            });
            let bdJson = null;
            try {
                bdJson = typeof bdRes.data === 'string' ? JSON.parse(bdRes.data) : bdRes.data;
            }
            catch (e) {
                logger.warn('[Yuki][weibo] 无法直接解析 bd 返回，尝试宽松解析：', bdRes.data.slice ? bdRes.data.slice(0, 200) : bdRes.data);
                const m = String(bdRes.data).match(/\{[\s\S]*\}/);
                if (m) {
                    try {
                        bdJson = JSON.parse(m[0]);
                    }
                    catch (e2) { }
                }
            }
            if (!bdJson || !bdJson.data || !bdJson.data.rid) {
                logger.warn('[Yuki][weibo] bd 未返回 rid，返回内容：', bdRes.data);
            }
            const rid = bdJson && bdJson.data ? bdJson.data.rid : Date.now().toString();
            logger.info('[Yuki][weibo] got rid:', rid);
            // 5) 查询是否已有 tid cookie
            let tid = WeiboRiskCookie.extractTidFromJarSync(jar);
            logger.info('[Yuki][weibo] existing tid cookie:', tid || '(none)');
            // 6) POST 到 genvisitor2（最终获取 cookie）
            const genUrl = WeiboApi.WEIBO_API.weiboGenVisitor;
            const genParams = {
                cb: 'visitor_gray_callback',
                ver: ver || '20250916',
                request_id: request_id || '',
                tid: tid || '',
                from: from || 'weibo',
                webdriver: 'false',
                rid: rid,
                return_url: return_url || START_URL
            };
            logger.info('[Yuki][weibo] POST genvisitor2 ->', genUrl, genParams);
            const genRes = await axios.post(genUrl, querystring.stringify(genParams), {
                jar,
                withCredentials: true,
                timeout: 10000,
                headers: WeiboRiskCookie.getHeadersForStep(6, `${enterUrl}?_rand=${rand}`),
                responseType: 'text'
            });
            const parsed = WeiboRiskCookie.parseCallbackJs(genRes.data);
            if (!parsed) {
                logger.warn('[Yuki][weibo] 无法解析 genvisitor2 返回（非标准 JSONP），原文片段：', String(genRes.data).slice(0, 500));
            }
            else {
                logger.info('[Yuki][weibo] genvisitor2 parsed:', parsed);
                if (parsed.retcode === 20000000 && parsed.data && parsed.data.tid) {
                    const tidVal = parsed.data.tid;
                    await jar.setCookie(`tid=${tidVal}; Domain=.weibo.cn; Path=/;`, START_URL);
                    logger.info('[Yuki][weibo] got tid from genvisitor2:', tidVal);
                }
            }
            if (!this.mergeVisitorCookies(jar, this.cookieJar)) {
                logger.info('[Yuki][weibo] genvisitor2 未签发可用 SUB，尝试 v1 访客接口');
                const legacyJar = await this.getLegacyVisitorCookieJar();
                this.mergeVisitorCookies(legacyJar, this.cookieJar);
            }
            return await this.persistVisitorSession();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`[Yuki][weibo] genvisitor2 访客 Cookie 获取失败，尝试 v1: ${message}`);
            try {
                const legacyJar = await this.getLegacyVisitorCookieJar();
                this.mergeVisitorCookies(legacyJar, this.cookieJar);
                return await this.persistVisitorSession();
            }
            catch (legacyError) {
                const legacyMessage = legacyError instanceof Error ? legacyError.message : String(legacyError);
                logger.warn(`[Yuki][weibo] 访客 Cookie 获取失败: ${legacyMessage}`);
                return false;
            }
        }
    }
    async getSessionCookieJar() {
        await this.initialization;
        await this.ensureVisitorCookies(this.cookieJar);
        return this.cookieJar;
    }
    async ensureLongLivedCookies(jar) {
        try {
            await this.loadCookiesFromRedis(jar);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[Yuki][weibo] 恢复 Redis Cookie 失败: ${message}`);
        }
        if (this.hasLoginCookies(jar))
            return true;
        return this.ensureVisitorCookies(jar);
    }
    /** 从 Redis 恢复 Cookie 到 CookieJar */
    async loadCookiesFromRedis(jar) {
        const pattern = `${this.prefix}:*:*`;
        // 第一步：扫描并迁移没有前导点的 domain 键（如 weibo.cn -> .weibo.cn）
        let keys = await Redis.keys(pattern);
        for (const key of keys) {
            if (key.endsWith(':meta'))
                continue;
            const parts = key.split(':');
            const name = parts.pop();
            const domainRaw = parts.pop() || '';
            if (!domainRaw.startsWith('.')) {
                const newDomain = `.${domainRaw}`;
                const newKey = `${this.prefix}:${newDomain}:${name}`;
                try {
                    const value = await Redis.get(key);
                    if (value == null) {
                        // nothing to migrate
                        continue;
                    }
                    const metaKey = `${key}:meta`;
                    const metaRaw = await Redis.get(metaKey);
                    const ttl = await Redis.ttl(key);
                    if (ttl > 0) {
                        await Redis.set(newKey, value, { EX: ttl });
                        if (metaRaw)
                            await Redis.set(`${newKey}:meta`, metaRaw, { EX: ttl });
                    }
                    else {
                        await Redis.set(newKey, value);
                        if (metaRaw)
                            await Redis.set(`${newKey}:meta`, metaRaw);
                    }
                    // 删除旧键和旧元数据
                    await Redis.del(key);
                    await Redis.del(metaKey);
                    logger.info(`[Yuki][weibo] Migrated cookie key "${key}" -> "${newKey}".`);
                }
                catch (e) {
                    logger.warn('[Yuki][weibo] Failed to migrate redis cookie key:', key, e);
                }
            }
        }
        // 重新获取 keys，确保后续都是规范域名
        keys = await Redis.keys(pattern);
        for (const key of keys) {
            if (key.endsWith(':meta'))
                continue; // 跳过 meta 键
            const value = await Redis.get(key);
            if (value == null)
                continue;
            // 解析 key 获取 name 和 domain
            const parts = key.split(':');
            const name = parts.pop(); // Cookie 的 key
            const domainRaw = parts.pop() || ''; // 可能已经是 .weibo.cn 或 .m.weibo.cn 等
            const domain = domainRaw.startsWith('.') ? domainRaw : `.${domainRaw}`; // 统一为带前导点
            // 获取元数据
            const metaKey = `${key}:meta`;
            const metaRaw = await Redis.get(metaKey);
            let meta = {};
            try {
                meta = metaRaw ? JSON.parse(metaRaw) : {};
            }
            catch (e) {
                meta = {};
            }
            // 构造 Cookie 字符串
            const ttl = await Redis.ttl(key);
            const path = meta.path || '/'; // 默认路径为 '/'
            let cookieStr = `${name}=${value}; Domain=${domain}; Path=${path};`;
            if (ttl > 0) {
                const exp = new Date(Date.now() + ttl * 1000).toUTCString();
                cookieStr += ` Expires=${exp};`;
            }
            if (meta.httpOnly)
                cookieStr += ' HttpOnly;';
            if (meta.secure)
                cookieStr += ' Secure;';
            try {
                // 动态生成 URL，host 去掉前导点
                const protocol = meta.secure ? 'https' : 'http';
                const host = domain.startsWith('.') ? domain.slice(1) : domain;
                const url = `${protocol}://${host}${path}`;
                // 设置 Cookie 到 jar
                await jar.setCookie(cookieStr, url);
                logger.info(`[Yuki][weibo] Restored cookie "${name}" for domain "${domain}" and path "${path}".`);
            }
            catch (e) {
                logger.warn(`[Yuki][weibo] Failed to restore cookie "${name}" for domain "${domain}" and path "${path}".`, e);
            }
        }
    }
    /**
     * 将 CookieJar 中的所有 Cookie 同步到 Redis
     */
    async saveCookiesToRedis(jar) {
        const allCookies = await new Promise((resolve, reject) => {
            jar.store.getAllCookies((err, cookies) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(cookies || []);
                }
            });
        });
        for (const cookie of allCookies) {
            if (!cookie)
                continue; // 跳过无效的 Cookie
            if (typeof cookie.value === 'string' && cookie.value.toLowerCase() === 'deleted')
                continue; // 跳过被删除的 Cookie
            // 规范 domain 为带前导点，避免子域不可见的问题
            const domainKey = cookie.domain ? (cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`) : '.weibo.cn';
            // 构造 Redis 键
            const redisKey = `${this.prefix}:${domainKey}:${cookie.key}`;
            // 计算 TTL（秒）；会话 Cookie 的 TTL 为 Infinity，需要无过期时间写入 Redis
            const ttlInMs = cookie.TTL ? cookie.TTL() : 0;
            if (ttlInMs <= 0)
                continue;
            const ttl = Number.isFinite(ttlInMs) ? Math.max(1, Math.floor(ttlInMs / 1000)) : -1;
            // 构造元数据
            const meta = JSON.stringify({
                path: cookie.path,
                httpOnly: !!cookie.httpOnly,
                secure: !!cookie.secure
            });
            // 写入 Redis（使用 TTL 时一并写 meta）
            try {
                if (ttl > 0) {
                    await Redis.set(redisKey, cookie.value, { EX: ttl });
                    await Redis.set(`${redisKey}:meta`, meta, { EX: ttl });
                }
                else {
                    await Redis.set(redisKey, cookie.value);
                    await Redis.set(`${redisKey}:meta`, meta);
                }
            }
            catch (error) {
                logger.warn('[Yuki][weibo] Failed to save cookie to Redis:', redisKey, error);
            }
        }
    }
    async requestWeiboLogout(jar) {
        let currentUrl = WeiboApi.WEIBO_API.weiboLogout;
        logger.info(`[Yuki][weibo] 开始请求微博服务端退出: ${currentUrl}`);
        for (let redirectCount = 0; redirectCount < 8; redirectCount += 1) {
            const currentOrigin = new URL(currentUrl).origin;
            const referer = new URL(currentUrl).hostname === 'passport.weibo.com' ? `${WeiboApi.WEIBO_API.weiboWebOrigin}/` : `${currentOrigin}/`;
            const response = await axios.get(currentUrl, {
                jar,
                withCredentials: true,
                timeout: 10000,
                maxRedirects: 0,
                responseType: 'text',
                validateStatus: status => status >= 200 && status < 400,
                headers: lodash.merge(WeiboApi.WEIBO_LOGOUT_HEADERS, { Referer: referer })
            });
            const location = response.headers.location;
            logger.info(`[Yuki][weibo] 服务端退出响应: HTTP ${response.status}${typeof location === 'string' && location ? ` -> ${location}` : ''}`);
            if (response.status < 300 || response.status >= 400)
                return;
            if (typeof location !== 'string' || !location) {
                throw new Error(`微博退出登录重定向缺少 Location: ${response.status}`);
            }
            currentUrl = new URL(location, currentUrl).toString();
        }
        throw new Error('微博退出登录重定向次数过多');
    }
    async revokeWeiboSession() {
        this.loginPollGeneration += 1;
        await this.initialization;
        const jar = this.cookieJar;
        if (!this.hasLoginCookies(jar)) {
            return { attempted: false, revoked: false, reason: 'not_logged_in' };
        }
        // 使用退出前的 Cookie 副本验证，避免登出接口仅清空当前 Jar 造成误判。
        let verificationJar;
        try {
            verificationJar = await jar.clone();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[Yuki][weibo] 复制登录 Cookie 失败，无法验证服务端退出: ${message}`);
            return { attempted: false, revoked: false, reason: 'verification_failed' };
        }
        try {
            await this.requestWeiboLogout(jar);
        }
        catch (error) {
            const isAxiosError = axios.isAxiosError(error);
            const status = isAxiosError ? error.response?.status : undefined;
            const responseData = isAxiosError ? error.response?.data : undefined;
            const message = error instanceof Error && error.message ? error.message : typeof error === 'string' && error ? error : '未知错误（异常未提供 message）';
            logger.warn(`[Yuki][weibo] 服务端退出请求失败${status ? `（HTTP ${status}）` : ''}: ${message}`, {
                name: error instanceof Error ? error.name : typeof error,
                code: isAxiosError ? error.code : error && typeof error === 'object' && 'code' in error ? error.code : undefined,
                url: isAxiosError ? error.config?.url : undefined,
                status,
                responseData: typeof responseData === 'string' ? responseData.slice(0, 500) : responseData,
                stack: error instanceof Error ? error.stack : undefined
            });
            return { attempted: true, revoked: false, reason: 'request_failed' };
        }
        try {
            const loginState = await this.requestLoginState(verificationJar);
            logger.info(`[Yuki][weibo] 服务端退出后登录态验证: ${loginState.data?.login === false ? '未登录' : '仍登录'}`);
            if (loginState.data?.login === false) {
                return { attempted: true, revoked: true, reason: 'revoked' };
            }
            return { attempted: true, revoked: false, reason: 'still_logged_in' };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[Yuki][weibo] 服务端退出后登录态验证失败: ${message}`);
            return { attempted: true, revoked: false, reason: 'verification_failed' };
        }
    }
    /**
     * 删除所有 Cookie 并同步清除 Redis 缓存
     */
    async resetCookiesAndRedis() {
        try {
            this.loginPollGeneration += 1;
            // 1. 清空 CookieJar 中的所有 Cookie
            const allCookies = await new Promise((resolve, reject) => {
                this.cookieJar.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
            if (allCookies.length > 0) {
                for (const cookie of allCookies) {
                    await this.cookieJar.setCookie(`${cookie.key}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`, `https://${cookie.domain}${cookie.path}`);
                }
                logger.info('[Yuki][weibo] All cookies in CookieJar have been cleared.');
            }
            else {
                logger.info('[Yuki][weibo] No cookies found in CookieJar to clear.');
            }
            // 2. 清除 Redis 中的 Cookie 缓存
            const pattern = `${this.prefix}:*:*`; // 匹配所有 Cookie 键
            const keys = await Redis.keys(pattern);
            if (keys.length > 0) {
                // 删除匹配的键及其元数据
                const deleteOperations = keys.map(key => ['del', key]);
                const metaKeys = keys.map(key => `${key}:meta`);
                deleteOperations.push(...metaKeys.map(metaKey => ['del', metaKey]));
                if (deleteOperations.length > 0) {
                    const multi = Redis.multi(); // 创建 multi 实例
                    deleteOperations.forEach(operation => {
                        multi[operation[0]](operation[1]); // 动态调用命令
                    });
                    await multi.exec(); // 执行批量操作
                    logger.info(`[Yuki][weibo] Deleted ${keys.length} cookies and their metadata from Redis.`);
                }
            }
            else {
                logger.info('[Yuki][weibo] No cookies found in Redis to clear.');
            }
            this.cookieJar = new tough.CookieJar(null, { looseMode: true });
            this.visitorCookieIssuedAt = 0;
            this.visitorCookieRetryAt = 0;
            this.loginConfirmed = false;
            this.initialization = this.initialize();
            await this.initialization;
            logger.info('[Yuki][weibo] Cookie reset completed successfully.');
        }
        catch (error) {
            logger.error('[Yuki][weibo] Error resetting cookies and Redis cache:', error);
            throw error;
        }
    }
    //** 从 CookieJar 中获取指定 key 的值 */
    async getCookieValueByKeyFromString(jar, key, url) {
        try {
            // 获取与 URL 匹配的所有 Cookie 字符串
            const cookieString = await new Promise((resolve, reject) => {
                jar.getCookieString(url, (err, cookieString) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookieString || '');
                });
            });
            // 解析目标 key 的值
            const match = cookieString.match(new RegExp(`${key}=([^;]+)`));
            return match ? match[1] : null;
        }
        catch (err) {
            logger.error(`[Yuki][weibo] Error fetching cookie with key "${key}":`, err);
            return null;
        }
    }
    /**
     * *******************************************************************
     * 微博登录
     * *******************************************************************
     */
    async requestLoginState(jar) {
        const url = WeiboApi.WEIBO_API.weiboLoginState;
        const X_XSRF_TOKEN = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url);
        return (await axios(url, {
            method: 'GET',
            jar,
            withCredentials: true,
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
                'X-XSRF-TOKEN': `${X_XSRF_TOKEN}`,
                'Host': 'm.weibo.cn',
                'Referer': WeiboApi.WEIBO_API.weiboMobileOrigin
            })
        })).data;
    }
    async requestWeiboProfile(jar, uid) {
        const url = `${WeiboApi.WEIBO_API.weiboProfileInfo}?uid=${uid}&scene=profile`;
        const X_XSRF_TOKEN = (await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'XSRF-TOKEN', url)) ||
            (await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url));
        return (await axios.get(url, {
            jar,
            withCredentials: true,
            timeout: 10000,
            headers: lodash.merge(WeiboApi.WEIBO_PROFILE_HEADERS, {
                'X-XSRF-TOKEN': X_XSRF_TOKEN || '',
                'Referer': `${WeiboApi.WEIBO_API.weiboWebOrigin}/u/${uid}`
            })
        })).data;
    }
    /**查看当前ck是否登录*/
    async checkWeiboLogin(e, silentNotLogged = false, includeProfile = true) {
        const jar = await WeiboCookieManager.getSessionCookieJar();
        const resData = await this.requestLoginState(jar);
        global?.logger?.debug(`微博验证登录状态:${JSON.stringify(resData)}`);
        if (resData.data?.login === false) {
            this.loginConfirmed = false;
            if (!silentNotLogged) {
                e.reply('微博账号未登录。\n注意：登录后如果检测动态频率设置过高可能会被微博风控/封号，请谨慎使用！');
            }
            return false;
        }
        else if (resData.data?.login === true) {
            this.loginConfirmed = true;
            const uid = Number(resData.data.uid);
            if (!Number.isFinite(uid) || uid <= 0) {
                e.reply('微博登录状态校验失败，未获取到有效 UID。');
                return false;
            }
            if (!includeProfile) {
                await e.reply(`~微博账号已登陆~\nuid：${uid}`);
                return true;
            }
            const profileRes = await this.requestWeiboProfile(jar, uid).catch(error => {
                const isAxiosError = axios.isAxiosError(error);
                const status = isAxiosError ? error.response?.status : undefined;
                const responseData = isAxiosError ? error.response?.data : undefined;
                const message = error instanceof Error && error.message ? error.message : typeof error === 'string' && error ? error : '未知错误（异常未提供 message）';
                logger.warn(`[Yuki][weibo] 获取微博官方资料失败${status ? `（HTTP ${status}）` : ''}: ${message}`, {
                    name: error instanceof Error ? error.name : typeof error,
                    code: isAxiosError ? error.code : error?.code,
                    url: isAxiosError ? error.config?.url : undefined,
                    status,
                    responseData: typeof responseData === 'string' ? responseData.slice(0, 500) : responseData,
                    stack: error instanceof Error ? error.stack : undefined
                });
                return null;
            });
            const user = profileRes?.data?.user;
            if (profileRes?.ok !== 1 || !user || (!user.idstr && !user.id)) {
                await e.reply(`~微博账号已登陆~\nuid：${uid}\n昵称：暂时无法获取（微博官方资料接口限制）`);
                return true;
            }
            const profileUid = user.idstr || user.id || uid;
            const followers = user.followers_count_str || user.followers_count || '未知';
            await e.reply(`~微博账号已登陆~\n昵称：${user.screen_name || '未知'}\nuid：${profileUid}\nsvip等级：${user.svip ?? '未知'}\n关注：${user.friends_count ?? '未知'}\n粉丝：${followers}`);
            return true;
        }
        e.reply('微博登录状态校验失败，请稍后重试。');
        return false;
    }
    /**
     * 扫码登录流程
     */
    async weiboLogin(e) {
        const generation = ++this.loginPollGeneration;
        const isLogin = await this.checkWeiboLogin(e, true, false);
        if (generation !== this.loginPollGeneration)
            return false;
        if (!isLogin) {
            const tokenKey = await this.applyLoginQRCode(e);
            if (generation !== this.loginPollGeneration)
                return false;
            if (tokenKey && tokenKey.rid) {
                const isSuccessLogin = await this.pollLoginQRCode(e, tokenKey.qrid, tokenKey.rid, tokenKey.X_CSRF_TOKEN, generation);
                return isSuccessLogin;
            }
        }
    }
    /**
     * 登录前访问bd接口获取rid
     * @param {string} X_CSRF_TOKEN - X_CSRF_TOKEN
     * @returns {Promise<JSON>} 服务器响应结果
     */
    async getRidFromBd(X_CSRF_TOKEN) {
        try {
            // 构造指纹并向 bd 发送加密数据以获取 rid
            const fp = WeiboRiskCookie.buildSimpleFingerprint();
            const bdPayload = await this.makeBdPayload(fp);
            const bdUrl = WeiboApi.WEIBO_API.weiboBd;
            logger.info('[Yuki][weibo] POST bd ->', bdUrl);
            const bdRes = await axios.post(bdUrl, querystring.stringify({ data: bdPayload, from: 'weibo' }), {
                withCredentials: true,
                headers: lodash.merge(WeiboApi.WEIBO_GET_BD_TOKEN_HEADERS, {
                    Origin: WeiboApi.WEIBO_API.weiboPassportOrigin,
                    Cookie: `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
                }),
                responseType: 'text'
            });
            // 尝试直接解析为 JSON
            let parsedData = {};
            if (typeof bdRes.data === 'string') {
                try {
                    parsedData = JSON.parse(bdRes.data);
                }
                catch (e) {
                    logger.warn('[Yuki][weibo] 微博登录前访问bd接口：无法直接解析 bd 返回，尝试宽松解析：', bdRes.data.slice ? bdRes.data.slice(0, 200) : bdRes.data);
                    // 宽松解析逻辑
                    const match = String(bdRes.data).match(/\{[\s\S]*\}/);
                    if (match) {
                        try {
                            parsedData = JSON.parse(match[0]);
                        }
                        catch (e2) {
                            logger.warn('[Yuki][weibo] 宽松解析失败，返回内容：', bdRes.data);
                        }
                    }
                }
            }
            else if (typeof bdRes.data === 'object') {
                parsedData = bdRes.data;
            }
            // 检查是否包含有效的 rid
            if (parsedData.retcode === 20000000 && parsedData.data?.rid) {
                return parsedData; // 返回完整的解析结果
            }
            else {
                logger.warn(`[Yuki][weibo] 微博登录前访问bd接口：返回异常，retcode=${parsedData.retcode}, msg=${parsedData.msg}`);
                return { retcode: parsedData.retcode || -1, msg: parsedData.msg || '无效响应', data: {} };
            }
        }
        catch (error) {
            logger.error('[Yuki][weibo] 微博登录前访问bd接口：发生异常', error);
            return { retcode: -1, msg: '网络请求或解析失败', error: String(error), data: {} };
        }
    }
    /**申请登陆二维码(web端) */
    async applyLoginQRCode(e) {
        const response = await fetch(WeiboApi.WEIBO_API.weiboSignin, {
            method: 'GET',
            headers: lodash.merge(WeiboApi.WEIBO_GET_X_CSRF_TOKEN_HEADERS, { Host: 'passport.weibo.com' }),
            redirect: 'follow'
        });
        const setCookie = response.headers.get('set-cookie');
        const tokenMatch = setCookie?.match(/X-CSRF-TOKEN=([^;]+)/);
        const X_CSRF_TOKEN = tokenMatch ? tokenMatch[1].replace(/X-CSRF-TOKEN=/g, '') : null;
        if (X_CSRF_TOKEN) {
            const resData = (await fetch(WeiboApi.WEIBO_API.weiboQrImage, {
                method: 'GET',
                headers: lodash.merge(WeiboApi.WEIBO_LOGIN_QR_CODE_HEADERS, {
                    'Host': 'passport.weibo.com',
                    'X-CSRF-TOKEN': X_CSRF_TOKEN,
                    'Cookie': `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
                }),
                redirect: 'follow'
            }).then(res => res.json()));
            if (resData?.retcode === 20000000) {
                const qrid = resData?.data?.qrid;
                const qrcodeUrl = resData?.data?.image;
                let msg = [];
                if (qrid && qrcodeUrl) {
                    const imgResponse = await fetch(qrcodeUrl, {
                        method: 'GET',
                        headers: WeiboApi.WEIBO_LOGIN_QR_CODE_IMAGE_HEADERS,
                        redirect: 'follow'
                    });
                    if (!imgResponse.ok) {
                        logger.error(`获取微博登录二维码失败: ${imgResponse.status}`);
                        throw new Error(`获取微博登录图片失败，状态码: ${imgResponse.status}`);
                    }
                    // 等待3秒再获取rid
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const ridData = (await this.getRidFromBd(X_CSRF_TOKEN));
                    if (ridData.retcode === 20000000) {
                        const rid = ridData.data?.rid;
                        const arrayBuffer = await imgResponse.arrayBuffer();
                        msg.push(Segment.image(Buffer.from(arrayBuffer)));
                        e.reply('请在3分钟内扫码以完成微博登陆绑定');
                        e.reply(msg);
                        logger.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 浏览器访问此URL查看二维码并扫码`);
                        logger.info(`优纪插件: 微博登陆二维码URL: ${qrcodeUrl}`);
                        return { qrid, rid, X_CSRF_TOKEN };
                    }
                    else {
                        logger.error('微博登录：获取rid失败', ridData);
                        e.reply(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}，\n接口逆向进度受阻，未完成，无法登录。\n已自动切换启用访客ck`);
                        throw new Error(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}，\n接口逆向进度受阻，未完成，无法登录。\n已自动切换启用访客ck`);
                    }
                }
            }
            else {
                e.reply(`获取微博登录二维码失败: ${JSON.stringify(resData)}`);
                throw new Error(`获取微博登录二维码失败: ${JSON.stringify(resData)}`);
            }
        }
        else {
            logger.error('微博登录：获取X_CSRF_TOKEN失败');
            return false;
        }
    }
    /**处理扫码结果 */
    async pollLoginQRCode(e, qrid, rid, X_CSRF_TOKEN, generation) {
        if (generation !== this.loginPollGeneration)
            return false;
        const params = new URLSearchParams({
            entry: 'wapsso',
            source: 'wapssowb',
            url: `${WeiboApi.WEIBO_API.weiboMobileOrigin}/`,
            qrid,
            rid,
            ver: '20250520'
        });
        const url = `${WeiboApi.WEIBO_API.weiboQrCheck}?${params}`;
        const response = await axios(url, {
            method: 'GET',
            headers: lodash.merge(WeiboApi.WEIBO_POLL_LOGIN_STATUS_HEADERS, {
                'X-CSRF-TOKEN': X_CSRF_TOKEN,
                'Cookie': `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
            }),
            maxRedirects: 0
        });
        if (!response) {
            throw new Error(`处理微博登录token网络请求失败，状态码: ${response?.status}`);
        }
        if (generation !== this.loginPollGeneration)
            return false;
        const data = (await response.data);
        if (data?.retcode === 20000000) {
            let currentUrl = data?.data?.url;
            if (!currentUrl) {
                await e.reply('获取微博登录跳转地址失败，请重新扫码。');
                return false;
            }
            const jar = new tough.CookieJar(null, { looseMode: true });
            let redirectCount = 0;
            while (currentUrl) {
                const resp = await axios.get(currentUrl, {
                    method: 'GET',
                    jar,
                    withCredentials: true,
                    headers: lodash.merge(WeiboApi.WEIBO_COOKIE_HEADERS, {
                        Referer: `${WeiboApi.WEIBO_API.weiboPassportOrigin}/`
                    }),
                    maxRedirects: 0,
                    validateStatus: status => status >= 200 && status < 400
                });
                if (generation !== this.loginPollGeneration)
                    return false;
                if (resp.status >= 300 && resp.status < 400) {
                    const location = resp.headers.location;
                    if (typeof location !== 'string' || !location) {
                        throw new Error(`微博登录重定向缺少 Location: ${resp.status}`);
                    }
                    currentUrl = new URL(location, currentUrl).toString();
                    redirectCount += 1;
                    if (redirectCount > 8)
                        throw new Error('微博登录重定向次数过多');
                    continue;
                }
                break;
            }
            const updatedCookies = await new Promise((resolve, reject) => {
                jar.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
            if (updatedCookies.length === 0) {
                await e.reply('获取微博登录 Cookie 失败，请重新扫码。');
                return false;
            }
            let loginState;
            try {
                loginState = await this.requestLoginState(jar);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`[Yuki][weibo] 扫码后登录状态校验失败: ${message}`);
                await e.reply('微博 Cookie 已获取，但登录状态校验失败，请稍后重试。');
                return false;
            }
            if (loginState.data?.login !== true) {
                await e.reply('微博登录状态校验未通过，请重新扫码或检查账号风控状态。');
                return false;
            }
            if (generation !== this.loginPollGeneration)
                return false;
            logger.info(`[Yuki][weibo] login verified, saving ${updatedCookies.length} cookies`);
            this.cookieJar = jar;
            this.loginConfirmed = true;
            this.visitorCookieIssuedAt = 0;
            this.visitorCookieRetryAt = 0;
            await WeiboCookieManager.saveCookiesToRedis(jar);
            await e.reply(`~微博登陆成功~`);
            return true;
        }
        else if (data?.retcode === 50114001) {
            // 未扫码
            // 继续轮询
            await new Promise(resolve => setTimeout(resolve, 2000));
            global?.logger?.mark(`优纪插件：扫码微博登录：未扫码，轮询中...`);
            return this.pollLoginQRCode(e, qrid, rid, X_CSRF_TOKEN, generation);
        }
        else if (data?.retcode === 50114002) {
            // 已扫码未确认
            // 继续轮询
            await new Promise(resolve => setTimeout(resolve, 2000));
            return this.pollLoginQRCode(e, qrid, rid, X_CSRF_TOKEN, generation);
        }
        else if (data?.retcode === 50114003) {
            // 二维码已失效
            e.reply('微博登陆二维码已失效');
            return false;
        }
        else {
            e.reply('处理微博登录扫码结果出错');
            throw new Error(`处理微博登录扫码结果出错: ${JSON.stringify(data)}`);
        }
    }
}
const WeiboCookieManager = new WeiboRiskCookie();

export { WeiboCookieManager as default };
