import BiliApi from './bilibili.main.api.js';
import { gen_buvid_fp } from './bilibili.risk.buid.fp.js';
import { getBiliTicket } from './bilibili.risk.ticket.js';
import { logger, Segment, Redis } from '../../utils/host.js';
import { renderPage } from '../../utils/image.js';
import { _paths } from '../../utils/paths.js';
import axioss from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import fs__default from 'fs';
import lodash from 'lodash';
import { promisify } from 'node:util';
import path__default from 'path';
import QRCode from 'qrcode';
import * as tough from 'tough-cookie';
import YAML from 'yaml';

const axios = wrapper(axioss);
const REDIS_PREFIX = 'Yz:yuki:bili:cookie';
class BiliRiskCookie {
    cookieJar;
    prefix;
    constructor() {
        this.prefix = REDIS_PREFIX;
        this.cookieJar = new tough.CookieJar();
        this.initialize().catch(err => logger?.error('BiliRiskCookie init error', err));
    }
    async initialize() {
        await this.ensureLoginCookies(this.cookieJar);
    }
    async getSessionCookieJar() {
        if (!this.cookieJar)
            this.cookieJar = new tough.CookieJar();
        return this.cookieJar;
    }
    /** 生成 _uuid */
    async genUUID() {
        const generatePart = (length) => Array.from({ length }, () => Math.floor(16 * Math.random()))
            .map(num => num.toString(16).toUpperCase())
            .join('');
        const padLeft = (str, length) => str.padStart(length, '0');
        const e = generatePart(8);
        const t = generatePart(4);
        const r = generatePart(4);
        const n = generatePart(4);
        const o = generatePart(12);
        const i = Date.now();
        const uuid = `_uuid=${e}-${t}-${r}-${n}-${o}${padLeft((i % 1e5).toString(), 5)}infoc;`;
        return uuid;
    }
    /**生成 b_lsid */
    async gen_b_lsid() {
        function get_random_str(length) {
            return Array.from({ length }, () => Math.floor(Math.random() * 16)
                .toString(16)
                .toUpperCase()).join('');
        }
        const timestamp = Date.now();
        const randomPart = get_random_str(8);
        const timestampHex = timestamp.toString(16).toUpperCase();
        return `b_lsid=${randomPart}_${timestampHex};`;
    }
    /** 获取 buvid3 和 buvid4 */
    async getBuvid3_4(uuid) {
        const url = 'https://api.bilibili.com/x/frontend/finger/spi/';
        const headers = lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
            Cookie: uuid,
            Host: 'api.bilibili.com',
            Origin: 'https://www.bilibili.com',
            Referer: 'https://www.bilibili.com/'
        });
        const response = await axios.get(url, { headers });
        const { code, data } = response.data;
        if (code === 0) {
            const { b_3: buvid3, b_4: buvid4 } = data;
            return `buvid3=${buvid3};buvid4=${buvid4};`;
        }
        else {
            return '';
        }
    }
    /**生成buvid_fp */
    async get_buvid_fp(uuid) {
        const fingerprintData = BiliApi.BILIBILI_FINGERPRINT_DATA(uuid);
        const buvidFp = gen_buvid_fp(fingerprintData);
        return `buvid_fp=${buvidFp};`;
    }
    /**获取新的tempCK（并写入 Jar）*/
    async getNewTempCk() {
        const uuid = await this.genUUID();
        const b_nut = `b_nut=${Math.floor(Date.now() / 1000)};`; //秒 时间戳，有效时间1年
        const buvid3_buvid4 = await this.getBuvid3_4(uuid); //有效时间1年
        const b_lsid = await this.gen_b_lsid();
        const buvid_fp = await this.get_buvid_fp(uuid);
        const newTemp = `${uuid}${buvid3_buvid4}${b_lsid}${buvid_fp}${b_nut}`;
        // 写入 Jar 持久化
        await this.setCookieString(newTemp, 'https://api.bilibili.com');
        return newTemp;
    }
    /**
     * B站扫码登录流程
     */
    async biliLogin(e) {
        const isLogin = await this.checkBiliLogin(e);
        if (!isLogin) {
            const tokenKey = await this.applyLoginQRCode(e);
            if (tokenKey) {
                await this.pollLoginQRCode(e, tokenKey);
            }
        }
        else {
            e.reply(`当前已有B站登录ck，请勿重复扫码！\n如需更换，请先删除当前登录ck：\n#yuki删除B站登录`);
        }
    }
    /**申请登陆二维码(web端) */
    async applyLoginQRCode(e) {
        const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header';
        const response = await fetch(url, {
            method: 'GET',
            headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-Agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { Host: 'passport.bilibili.com' }),
            redirect: 'follow'
        });
        if (!response.ok) {
            throw new Error(`获取B站登录二维码URL网络请求失败，状态码: ${response.status}`);
        }
        const res = (await response.json());
        if (res?.code === 0) {
            const qrcodeKey = res?.data?.qrcode_key;
            const qrcodeUrl = res?.data?.url;
            let loginUrlQrcodeData = await QRCode.toDataURL(`${qrcodeUrl}`);
            const LoginPropsData = {
                data: { name: 'B站', url: loginUrlQrcodeData }
            };
            const ScreenshotOptionsData = {
                saveHtmlfile: false,
                modelName: 'bili-login'
            };
            const qrCodeImage = await renderPage('bili-login', 'LoginQrcodePage', LoginPropsData, ScreenshotOptionsData);
            let qrCodeBufferArray = [];
            if (qrCodeImage !== false) {
                const { img } = qrCodeImage;
                qrCodeBufferArray = img;
            }
            let msg = [];
            if (qrCodeBufferArray.length === 0) {
                msg.push('渲染二维码图片失败，请查看终端输出的实时日志，\n复制哔哩登陆二维码URL，使用在线或本地二维码生成工具生成二维码并扫码。');
            }
            else {
                msg.push(Segment.image(qrCodeBufferArray[0]));
            }
            e.reply('请在3分钟内扫码以完成B站登陆绑定');
            e.reply(msg);
            logger.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 使用在线或本地二维码生成工具生成二维码并扫码`);
            logger.info(`优纪插件: 哔哩登陆二维码URL: ${qrcodeUrl}`);
            return qrcodeKey;
        }
        else {
            e.reply(`获取B站登录二维码失败: ${JSON.stringify(res.data)}`);
            throw new Error(`获取B站登录二维码失败: ${JSON.stringify(res.data)}`);
        }
    }
    /**处理扫码结果（扫码成功后将 set-cookie 写入 Jar 并持久化）*/
    async pollLoginQRCode(e, qrcodeKey) {
        const url = `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcodeKey}&source=main-fe-header`;
        const jar = await this.getSessionCookieJar();
        const response = await axios.get(url, {
            jar,
            withCredentials: true,
            headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { Host: 'passport.bilibili.com' })
        });
        if (!response.status || response.status !== 200) {
            throw new Error(`处理B站登录token网络请求失败，状态码: ${response.status}`);
        }
        let data = (await response.data);
        if (data?.code === 0) {
            if (data?.data?.code === 0) {
                // 登录成功，获取 set-cookie header 并写入 Jar
                const SESSDATA_expires = await this.getCookieExpiration(jar, 'SESSDATA', 'https://passport.bilibili.com');
                try {
                    if (SESSDATA_expires != null) {
                        const tempCookie = await this.getNewTempCk();
                        // 写入 CookieJar 并持久化
                        await this.setCookieString(tempCookie, 'https://api.bilibili.com');
                        await this.saveCookiesToRedis(jar);
                        e.reply(`~B站登陆成功~`);
                        const cookieString = await new Promise((resolve, reject) => {
                            jar.getCookieString('https://api.bilibili.com', (err, cookieString) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(cookieString || '');
                            });
                        });
                        const result = await this.postGateway(cookieString); //激活ck
                        const { code, data } = await result.data; // 解析校验结果
                        switch (code) {
                            case 0:
                                global?.logger?.mark(`优纪插件：获取biliLoginCK，Gateway校验成功：${JSON.stringify(data)}`);
                                break;
                            default:
                                global?.logger?.mark(`优纪插件：获取biliLoginCK，Gateway校验失败：${JSON.stringify(data)}`);
                                break;
                        }
                        return true;
                    }
                    else {
                        e.reply(`获取B站登录CK失败: ${data?.data?.message}`);
                        return false;
                    }
                }
                catch (err) {
                    logger.error(`获取B站登录CK失败: ${data?.data?.message}`);
                    logger.error(err);
                    e.reply(`获取B站登录CK失败: ${data?.data?.message?.slice(0, 100)}...`);
                    return false;
                }
            }
            else if (data?.data?.code === 86101) {
                // 继续轮询
                await new Promise(resolve => setTimeout(resolve, 2000));
                (logger ?? Bot.logger)?.mark(`优纪插件：扫码B站登录：未扫码，轮询中...`);
                return this.pollLoginQRCode(e, qrcodeKey);
            }
            else if (data?.data?.code === 86090) {
                // 已扫码未确认
                // 继续轮询
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.pollLoginQRCode(e, qrcodeKey);
            }
            else if (data?.data?.code === 86038) {
                // 二维码已失效
                e.reply('B站登陆二维码已失效');
                return null;
            }
            else {
                e.reply('处理扫码结果出错');
                throw new Error(`处理扫码结果出错: ${data?.data?.message}`);
            }
        }
        else {
            function safeStringify(obj, indent = 2) {
                const seen = new WeakSet();
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular]'; // 标记循环引用
                        }
                        seen.add(value); // 记录已访问的对象
                    }
                    return value;
                }, indent);
            }
            e.reply('处理扫码结果出错');
            throw new Error(`处理扫码结果出错: ${safeStringify(data)}`);
        }
    }
    /**查看当前 Jar 中的登录 cookie 有效状态并返回信息（改为基于 jar）*/
    async checkBiliLogin(e) {
        // 读取 jar 中 api.bilibili.com 的 cookie 字符串
        const jar = await this.getSessionCookieJar();
        const SESSDATA_expires = await this.getCookieExpiration(jar, 'SESSDATA', 'https://api.bilibili.com');
        const SESSDATA_str = await this.getCookieValueByKeyFromString(jar, 'SESSDATA', 'https://api.bilibili.com');
        if (SESSDATA_expires === null) {
            e.reply('当前未登录B站，接下来请扫码登录。');
            return false;
        }
        else {
            const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
                method: 'GET',
                headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, {
                    'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'],
                    'Cookie': SESSDATA_str ? SESSDATA_str : ''
                }),
                redirect: 'follow'
            });
            const resData = await res.json();
            if (resData.code === 0) {
                const uname = resData.data?.uname;
                const mid = resData.data?.mid;
                const money = resData.data?.money;
                const level_info = resData.data?.level_info;
                const current_level = level_info?.current_level;
                const current_exp = level_info?.current_exp;
                const next_exp = level_info?.next_exp;
                const ttl = SESSDATA_expires;
                const LoginCookieTTLStr = ttl === -1 ? '永久' : ttl === -2 ? '-' : `${new Date(Date.now() + ttl).toLocaleString()}`;
                e.reply(`~B站账号已登陆~\n有效期至：${LoginCookieTTLStr}。\n昵称：${uname}\nuid：${mid}\n硬币：${money}\n经验等级：${current_level}\n当前经验值exp：${current_exp}\n下一等级所需exp：${next_exp}`);
                return true;
            }
            else if (resData.code === -101) {
                e.reply('B站登录CK已失效，请重新扫码登录');
            }
            else {
                e.reply('意外情况，未能成功获取登录ck的有效状态');
            }
        }
    }
    /**
     * 请求参数POST接口(ExClimbWuzhi)过校验
     */
    async postGateway(cookie) {
        const _uuid = await this.readSavedCookieItems(cookie, ['_uuid'], false);
        const payloadJsonData = await BiliApi.BILIBILI_BROWSER_DATA('_uuid=' + _uuid);
        const data = { payload: JSON.stringify(payloadJsonData) };
        const requestUrl = 'https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi';
        const config = {
            headers: lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
                'Content-type': 'application/json;charset=UTF-8'
            }, {
                Host: 'api.bilibili.com',
                Origin: 'https://www.bilibili.com',
                Referer: 'https://www.bilibili.com/'
            })
        };
        try {
            const res = await axios.post(requestUrl, data, config);
            return res;
        }
        catch (error) {
            logger.error('Error making POST request:', error);
            throw error;
        }
    }
    /**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
    async exitBiliLogin(e) {
        const url = 'https://passport.bilibili.com/login/exit/v2';
        const jar = await this.getSessionCookieJar();
        const [SESSDATA, biliCSRF, DedeUserID] = await Promise.all([
            await this.getCookieValueByKeyFromString(jar, 'SESSDATA', 'https://api.bilibili.com'),
            await this.getCookieValueByKeyFromString(jar, 'bili_jct', 'https://api.bilibili.com'),
            await this.getCookieValueByKeyFromString(jar, 'DedeUserID', 'https://api.bilibili.com')
        ]);
        if (lodash.trim(SESSDATA).length === 0 || lodash.trim(biliCSRF).length === 0 || lodash.trim(DedeUserID).length === 0) {
            e.reply('当前无可用的B站登录CK可退出登录');
            return;
        }
        const postData = String(biliCSRF)
            .trim()
            .replace(/^bili_jct=/g, '')
            .replace(/;*$/g, '');
        try {
            const resp = await axios.post(url, { biliCSRF: postData }, {
                headers: {
                    'Host': 'passport.bilibili.com',
                    'User-Agent': BiliApi.BILIBILI_HEADERS['User-Agent'],
                    'Cookie': `DedeUserID]=${DedeUserID};bili_jct=${biliCSRF};SESSDATA=${SESSDATA}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const contentType = resp.headers['Content-Type'];
            if (typeof contentType === 'string' && contentType.includes('text/html')) {
                e.reply('当前缓存的B站登录CK早已失效！');
                return;
            }
            const res = resp.data;
            logger?.debug(`exitBiliLogin:  ${JSON.stringify(res)}`);
            const { code } = res;
            switch (code) {
                case 0:
                    e.reply('当前缓存的B站登录CK已在B站服务器退出登录~');
                    break;
                case 2202:
                    e.reply('csrf 请求非法，退出登录请求出错');
                    break;
                case -101:
                    e.reply('当前缓存的扫码B站ck未登录！');
                    break;
                default:
                    e.reply('未知情况！无妨');
                    return;
            }
        }
        catch (error) {
            e.reply('退出登录请求出错');
            console.error('Error during Bili login exit:', error);
        }
    }
    /**
     * 获取有效bili_ticket并添加到cookie（bili_ticket 仍缓存于 Redis 单独 key）
     */
    async checkCookieBiliTicket() {
        const bili_jct_expires = await this.getCookieExpiration(this.cookieJar, 'bili_jct', 'https://api.bilibili.com');
        if (bili_jct_expires === null) {
            try {
                const { ticket, ttl } = await getBiliTicket('');
                if (ticket && ttl) {
                    await this.setCookieString([
                        new tough.Cookie({
                            key: 'bili_jct',
                            value: ticket,
                            domain: '.bilibili.com',
                            path: '/',
                            expires: new Date(Date.now() + ttl) // 3天后过期
                        })
                    ]);
                    return `bili_ticket=${ticket};`;
                }
                else {
                    throw new Error('获取bili_ticket失败');
                }
            }
            catch (error) {
                logger?.error(`${error}`);
            }
        }
        else {
            return `bili_jct=${await this.getCookieValueByKeyFromString(this.cookieJar, 'bili_jct', 'https://api.bilibili.com')};`;
        }
    }
    /**
     * 将 非标准化 bilibili 的 cookie 写入 jar 并持久化到 Redis
     * 支持两种输入形式：
     * 1. Cookie 数组：[{ key: 'name', value: 'value', 'domain': 'domain', 'expires': new Date() ,'path': 'path', 'httpOnly': true, 'secure': true }, ...]
     * 2. 字符串形式：'a=1; b=2;'
     */
    async setCookieString(input, url = 'https://api.bilibili.com') {
        const jar = await this.getSessionCookieJar();
        // 默认过期时间为一年
        const DEFAULT_EXPIRATION = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        try {
            if (Array.isArray(input)) {
                // 处理数组形式的 Cookie 输入
                input.forEach(cookie => {
                    if (!(cookie instanceof tough.Cookie)) {
                        throw new Error('数组中的元素必须是 tough.Cookie 类型');
                    }
                    // 如果未设置 expires 或 maxAge，默认设置为一年
                    if (!cookie.expires && typeof cookie.maxAge !== 'number') {
                        cookie.setExpires(DEFAULT_EXPIRATION);
                    }
                    jar.setCookieSync(cookie, url);
                });
            }
            else if (typeof input === 'string') {
                // 处理字符串形式的 Cookie 输入
                if (!input || input.trim().length === 0)
                    return;
                const parts = input
                    .split(';')
                    .map(s => s.trim())
                    .filter(Boolean);
                for (const part of parts) {
                    const [k, ...rest] = part.split('=');
                    const v = rest.join('=');
                    if (!k)
                        continue;
                    // 构造 Cookie 字符串，并默认设置 Domain 和 Path
                    const cookieStr = `${k}=${v}; Domain=.bilibili.com; Path=/; Expires=${DEFAULT_EXPIRATION.toUTCString()}`;
                    try {
                        await jar.setCookie(cookieStr, url);
                    }
                    catch (e) {
                        logger?.warn('setCookieString setCookie failed', cookieStr, e);
                    }
                }
            }
            else {
                throw new Error('输入类型无效，仅支持字符串或 tough.Cookie 数组');
            }
            // 持久化到 Redis
            await this.saveCookiesToRedis(jar);
        }
        catch (err) {
            logger?.error('setCookieString error', err);
            throw err;
        }
    }
    /**
     * 简单策略：优先从 Redis 读取长期 cookie（如 SUP/SUBP），若缺失则触发完整获取流程
     * */
    async ensureLoginCookies(jar) {
        // 常见域名为 .weibo.cn 或 m.weibo.cn，根据实际情况检查
        const SESSDATA_Key1 = `${this.prefix}:.bilibili.com:SESSDATA`;
        const SESSDATA_Key2 = `${this.prefix}:bilibili.com:SESSDATA`;
        const isLogin = (await Redis.get(SESSDATA_Key1)) || (await Redis.get(SESSDATA_Key2));
        if (isLogin) {
            // 直接把 Redis 的所有 cookie 恢复到 jar（包含 SUP/SUBP）
            await this.loadCookiesFromRedis(jar);
            return true;
        }
        else {
            // 缺少长期 cookie：返回 false，调用方需执行完整流程生成并持久化
            await this.getNewTempCk();
            return false;
        }
    }
    /** 从 Redis 恢复到 cookieJar */
    async loadCookiesFromRedis(jar) {
        try {
            const pattern = `${this.prefix}:*:*`;
            const keys = (await Redis.keys(pattern)) || [];
            if (!keys.length)
                return;
            for (const key of keys) {
                if (key.endsWith(':meta'))
                    continue; // 跳过 meta 键
                const raw = await Redis.get(key);
                if (raw == null)
                    continue;
                // 解析 key 获取 name 和 domain
                const parts = key.split(':');
                const name = parts.pop();
                const domain = parts.pop();
                // 获取元数据
                const metaRaw = await Redis.get(`${key}:meta`);
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
                let cookieStr = `${name}=${raw}; Domain=${domain}; Path=${path};`;
                if (ttl && ttl > 0) {
                    const exp = new Date(Date.now() + ttl * 1000).toUTCString();
                    cookieStr += ` Expires=${exp};`;
                }
                if (meta.httpOnly)
                    cookieStr += ' HttpOnly;';
                if (meta.secure)
                    cookieStr += ' Secure;';
                try {
                    // 动态生成 URL
                    if (domain) {
                        const host = domain.startsWith('.') ? domain.slice(1) : domain; // 去掉前导的 '.'
                        const protocol = meta.secure ? 'https' : 'https';
                        const url = `${protocol}://${host}${path}`;
                        // 设置 Cookie 到 jar
                        await jar.setCookie(cookieStr, url);
                    }
                }
                catch (e) {
                    logger?.warn('Failed to restore cookie to jar', key, e);
                }
            }
        }
        catch (err) {
            logger?.error('loadCookiesFromRedis failed', err);
        }
    }
    /** 从 CookieJar 中读取所有 cookie 并保存到 Redis（按 name/domain 存） */
    /**
     * 将 CookieJar 中的所有 Cookie 同步到 Redis
     */
    async saveCookiesToRedis(jar) {
        // 获取所有 Cookie
        this.cookieJar = jar;
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
            // 替换passport.bilibili.com域名为.bilibili.com，以便正确跨域，构造 Redis 键
            let domain = cookie.domain;
            if (domain === 'passport.bilibili.com') {
                domain = '.bilibili.com';
            }
            const redisKey = `${this.prefix}:${domain}:${cookie.key}`;
            // 使用 cookie.TTL() 方法计算 TTL
            let ttl = 0;
            const ttlInMs = cookie.TTL(); // TTL 返回的是毫秒值
            if (ttlInMs && ttlInMs > 0 && isFinite(ttlInMs)) {
                ttl = Math.floor(ttlInMs / 1000); // 转换为秒
            }
            else if (ttlInMs === 0 || !isFinite(ttlInMs)) {
                // 如果 TTL 为 0，表示 Cookie 已过期，跳过存储
                continue;
            }
            else {
                ttl = -1;
            }
            // 构造元数据
            const meta = JSON.stringify({
                path: cookie.path,
                httpOnly: !!cookie.httpOnly,
                secure: !!cookie.secure
            });
            // 写入 Redis
            if ((ttl && ttl > 0) || ttl === -1) {
                await Redis.set(redisKey, cookie.value, { EX: ttl }); // 设置键值对，并指定 TTL
                await Redis.set(`${redisKey}:meta`, meta, { EX: ttl }); // 存储元数据，TTL 与主键一致
            }
            else {
                // 如果没有 TTL（例如会话 Cookie），直接存储
                await Redis.set(redisKey, cookie.value);
                await Redis.set(`${redisKey}:meta`, meta);
            }
        }
    }
    /** 清空 jar 与 Redis 中该前缀的 cookie */
    async resetCookiesAndRedis() {
        try {
            const jar = await this.getSessionCookieJar();
            // 1. 清空 CookieJar 中的所有 Cookie
            const allCookies = await new Promise((resolve, reject) => {
                jar.store.getAllCookies((err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
            for (const cookie of allCookies) {
                try {
                    await jar.setCookie(`${cookie.key}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`, `https://${cookie.domain}${cookie.path}`);
                }
                catch (e) { }
            }
            // 2. 清除 Redis 中的 Cookie 缓存
            const pattern = `${this.prefix}:*:*`;
            const keys = (await Redis.keys(pattern)) || [];
            if (keys.length) {
                const delKeys = [];
                for (const k of keys) {
                    delKeys.push(k);
                    delKeys.push(`${k}:meta`);
                }
                if (delKeys.length)
                    await Promise.all(delKeys.map(key => Redis.del(key)));
            }
            this.cookieJar = new tough.CookieJar();
        }
        catch (err) {
            logger?.error('resetCookiesAndRedis failed', err);
            throw err;
        }
    }
    /** 从 jar 中获取指定 URL 的 cookie 字符串 */
    async getCookieStringForUrl(url) {
        try {
            const jar = await this.getSessionCookieJar();
            const cookieString = await new Promise((resolve, reject) => {
                jar.getCookieString(url, (err, cs) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cs || '');
                });
            });
            return cookieString;
        }
        catch (err) {
            logger?.error('getCookieStringForUrl error', err);
            return '';
        }
    }
    /** 从 jar 中获取指定 key 的值（基于 url） */
    async getCookieValueByKeyFromString(jar, key, url) {
        try {
            const cookieString = await new Promise((resolve, reject) => {
                jar.getCookieString(url, (err, cookieString) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookieString || '');
                });
            });
            const match = cookieString.match(new RegExp(`${key}=([^;]+)`));
            return match ? match[1] : undefined;
        }
        catch (err) {
            logger?.error('getCookieValueByKeyFromString error', err);
            return undefined;
        }
    }
    /**
     * 获取指定 key 的 Cookie 的过期时间（时间戳，毫秒级）
     * @param jar CookieJar 实例
     * @param key 要查询的 Cookie 键名
     * @param url 与 Cookie 关联的 URL
     * @returns 过期时间的时间戳（毫秒级）或 null（如果未设置）
     */
    async getCookieExpiration(jar, key, url) {
        try {
            // 获取所有与 URL 相关的 Cookie
            const cookies = await new Promise((resolve, reject) => {
                jar.getCookies(url, (err, cookies) => {
                    if (err)
                        reject(err);
                    else
                        resolve(cookies || []);
                });
            });
            // 查找目标 key 的 Cookie
            const targetCookie = cookies.find(cookie => cookie.key === key);
            if (!targetCookie)
                return null;
            // 如果存在 expires，判断其类型
            if (targetCookie.expires instanceof Date) {
                return targetCookie.expires.getTime(); // 返回时间戳
            }
            else if (targetCookie.expires === 'Infinity') {
                return -1; // 返回 -1 Infinity 表示永不过期
            }
            // 如果存在 maxAge，计算过期时间戳
            if (typeof targetCookie.maxAge === 'number' && !isNaN(targetCookie.maxAge)) {
                return Date.now() + targetCookie.maxAge * 1000;
            }
            // 如果既没有 expires 也没有 maxAge，返回 null（会话级别 Cookie）
            return null;
        }
        catch (err) {
            console.error('获取 Cookie 过期时间失败', err);
            throw err;
        }
    }
    /** 综合获取ck，返回优先级：localCK > loginCK > tempCK */
    async readSyncCookie() {
        const localCk = await this.readLocalBiliCk();
        const SESSDATA_expires = await this.getCookieExpiration(this.cookieJar, 'SESSDATA', 'https://api.bilibili.com');
        const validCk = (ck) => ck?.trim().length > 10;
        if (validCk(localCk)) {
            return { cookie: localCk, mark: 'localCk' };
        }
        else if (!validCk(localCk) && SESSDATA_expires !== null) {
            return { cookie: await this.getSessionCookieJar(), mark: 'loginCk' };
        }
        else if (!validCk(localCk) && SESSDATA_expires === null) {
            return { cookie: await this.getSessionCookieJar(), mark: 'tempCk' };
        }
        return { cookie: '', mark: 'ckIsEmpty' };
    }
    /** 读取手动绑定的B站ck */
    async readLocalBiliCk() {
        const dir = path__default.join(_paths.root, 'data/yuki-plugin/');
        if (!fs__default.existsSync(dir)) {
            fs__default.mkdirSync(dir, { recursive: true }); // 创建目录，包括父目录
        }
        const files = fs__default.readdirSync(dir).filter((file) => file.endsWith('biliCookie.yaml'));
        const readFile = promisify(fs__default.readFile);
        const promises = files.map((file) => readFile(path__default.join(dir, file), 'utf8'));
        const contents = await Promise.all(promises);
        const Bck = contents.map((content) => YAML.parse(content));
        return Bck[0] || '';
    }
    /** 覆盖保存手动获取绑定的B站ck */
    async saveLocalBiliCk(data) {
        const dirPath = path__default.join(_paths.root, 'data/yuki-plugin/');
        const filePath = path__default.join(dirPath, 'biliCookie.yaml');
        const cleanedData = String(data).replace(/\s/g, '').trim();
        if (lodash.isEmpty(cleanedData)) {
            fs__default.existsSync(filePath) && fs__default.unlinkSync(filePath);
        }
        else {
            if (!fs__default.existsSync(dirPath)) {
                fs__default.mkdirSync(dirPath, { recursive: true });
            }
            const yamlContent = YAML.stringify(cleanedData);
            fs__default.writeFileSync(filePath, yamlContent, 'utf8');
        }
    }
    /**
     * 综合读取、筛选 传入的或本地或redis存储的cookie的item
     * @param {string} mark 读取存储的CK类型，'localCK'  'loginCK' 或传入值 'xxx'并进行筛选
     * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState','ALF']
     * @param {boolean} isInverted 控制正取和反取，true为反取，默认为false正取
     * @returns {string}
     **/
    async readSavedCookieItems(mark, items, isInverted = false) {
        let ckString;
        switch (mark) {
            case 'localCK':
                ckString = await this.readLocalBiliCk();
                break;
            case 'loginCK':
                ckString = await this.getCookieStringForUrl('https://api.bilibili.com');
                break;
            default:
                ckString = mark;
        }
        const Wck = lodash.trim(ckString);
        if (!Wck) {
            return '';
        }
        if (items[0] === 'all') {
            return Wck;
        }
        const cookiePairs = String(Wck)
            .trim()
            .match(/([a-zA-Z0-9_-]+)=([^;|,]+)/g) //正则 /(\w+)=([^;]+);/g 匹配 a=b 的内容，并分组为 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符
            ?.map(match => match.split('='))
            .filter(([key, value]) => (isInverted ? !items.includes(key) : items.includes(key)) && value !== '')
            .map(([key, value]) => `${key}=${value}`)
            .join(';') || '';
        return cookiePairs;
    }
    // 取反读取ck、筛选 传入的或本地或redis存储的cookie的item
    async readSavedCookieOtherItems(mark, items) {
        return await this.readSavedCookieItems(mark, items, true);
    }
}
const BiliCookieManager = new BiliRiskCookie();

export { BiliCookieManager as default };
