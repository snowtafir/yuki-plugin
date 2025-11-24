import WeiboApi from '@src/models/weibo/weibo.main.api';
import axioss, { AxiosError } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import crypto from 'crypto';
import lodash from 'lodash';
import fetch from 'node-fetch';
import querystring from 'querystring';
import * as tough from 'tough-cookie';
import { Redis, Segment } from 'yunzaijs';
const axios = wrapper(axioss);

declare const logger: any;

const START_URL = 'https://m.weibo.cn/u/7643376782';

class WeiboRiskCookie {
  cookieJar: tough.CookieJar;
  prefix: string;
  constructor() {
    this.prefix = 'Yz:yuki:weibo:cookie';
    this.cookieJar = new tough.CookieJar(null, { looseMode: true });
    this.initialize();
  }
  async initialize() {
    await this.ensureLongLivedCookies(this.cookieJar);
  }
  // 新增：根据步骤返回严格的请求头
  static getHeadersForStep(step, referer?: string) {
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
        return Object.assign(
          {
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
          },
          referer ? { referer: referer } : {}
        );
      case 4: // GET 1.2.1.umd.js
        return Object.assign(
          {
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
          },
          referer ? { referer: referer } : {}
        );
      case 5: // POST bd
        return {
          'accept': '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'zh-CN,zh;q=0.9',
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://visitor.passport.weibo.cn',
          'priority': 'u=1, i',
          'referer': 'https://visitor.passport.weibo.cn/',
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
          'origin': 'https://visitor.passport.weibo.cn',
          'priority': 'u=1, i',
          'referer': referer || 'https://visitor.passport.weibo.cn/visitor/visitor',
          /*           'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"', */
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': `${WeiboApi.USER_AGENT}`
        };
      default:
        return {};
    }
  }
  async fetchInitialHtml(jar: tough.CookieJar) {
    const res = await axios.get(START_URL, {
      jar,
      withCredentials: true,
      headers: WeiboRiskCookie.getHeadersForStep(1),
      responseType: 'text'
    });
    return res.data;
  }

  static extractParamsFromHtml(html: string) {
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
    const randFracInt = (base: number, min = 0.6, max = 1) => {
      const v = min + Math.random() * (max - min); // 0.6-1
      return Math.floor(base * v); // 换成 Math.round(...) 或 Math.ceil(...) 根据需要
    };
    return JSON.stringify({
      fp: {
        '0': { s: 1, v: '1.2.1' },
        '1': { s: 1, v: false },
        '2': { s: 1, v: ['lang'] },
        '3': { s: 1, v: `${WeiboApi.USER_AGENT}` },
        '4': { s: -1, v: '' },
        '5': { s: 1, v: 33 },
        '6': { s: -1, v: '' },
        '7': { s: 1, v: [['zh-CN'], ['zh-CN']] },
        '8': { s: 1, v: true },
        '9': { s: 1, v: 'default' },
        '10': { s: 1, v: true },
        '11': { s: 1, v: 5 },
        '12': { s: -1, e: '' },
        '13': { s: 1, v: '20030107' },
        '14': { s: -1, e: '' },
        '15': { s: 1, v: `${WeiboApi.USER_AGENT}` },
        '16': { s: 1, v: { vendor: 'WebKit', renderer: 'WebKit WebGL' } },
        '17': { s: -1, v: '' },
        '18': {
          s: 1,
          v: { ow: randFracInt(2235, 0.6, 1), oh: randFracInt(1210, 0.6, 1), iw: randFracInt(589, 0.6, 1), ih: randFracInt(1089, 0.6, 1) }
        },
        '19': { s: 1, v: 'chrome' },
        '20': { s: 1, v: 'webkit' },
        '21': { s: 1, v: false },
        '22': { s: 1, v: true },
        '23': {
          s: 1,
          v: { ots: false, mtp: 0, mmtp: -1 }
        }
      },
      bh: {
        mt: [],
        kt: {
          down: 0,
          up: 0
        }
      },
      meta: {
        isTraceKeyboard: false,
        isTraceMouse: false
      }
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
  static derToPem(derBuf: Buffer<ArrayBuffer>) {
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
    const rsaCipher = crypto.publicEncrypt(
      {
        key: pubPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      rsaPlain
    );

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
      headers: Object.assign(
        {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': `${WeiboApi.USER_AGENT}`,
          'Referer': START_URL
        },
        extraHeaders
      ),
      responseType: 'text'
    });
    return res;
  }

  static parseCallbackJs(jsText, cbName = 'visitor_gray_callback') {
    let m = jsText.match(new RegExp(cbName + '\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*;?'));
    if (m) {
      try {
        return JSON.parse(m[1]);
      } catch (e) {
        /* fallthrough */
      }
    }
    m = jsText.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (e) {}
    }
    return null;
  }

  async getNewSessionCookie() {
    try {
      const jar = new tough.CookieJar();

      // 1) GET 初始页面
      const html = await this.fetchInitialHtml(jar);

      // 2) 解析页面内参数
      const { request_id, return_url, ver, from } = WeiboRiskCookie.extractParamsFromHtml(html);
      logger.info('parsed params:', { request_id, return_url, ver, from });

      // 3) POST 到 visitor enter（按真实流程）
      const enterUrl = 'https://visitor.passport.weibo.cn/visitor/visitor';
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
      logger.info('POST enter ->', enterUrl, enterParams);
      await axios.post(enterUrl, querystring.stringify(enterParams), {
        jar,
        withCredentials: true,
        headers: WeiboRiskCookie.getHeadersForStep(2),
        responseType: 'text'
      });

      // 3.1 GET mini_original.js（模拟脚本加载）
      const miniJsUrl = 'https://visitor.passport.weibo.cn/js/visitor/mini_original.js?v=20161116';
      logger.info('GET mini_original.js ->', miniJsUrl);
      await axios.get(miniJsUrl, {
        jar,
        withCredentials: true,
        headers: WeiboRiskCookie.getHeadersForStep(3, `${enterUrl}?_rand=${rand}`),
        responseType: 'text'
      });

      // 3.2 GET 1.2.1.umd.js（模拟脚本加载）
      const umdJsUrl = 'https://passport.sinaimg.cn/js/fp/1.2.1.umd.js';
      logger.info('GET 1.2.1.umd.js ->', umdJsUrl);
      await axios.get(umdJsUrl, {
        jar,
        withCredentials: true,
        headers: WeiboRiskCookie.getHeadersForStep(4, 'https://visitor.passport.weibo.cn/'),
        responseType: 'text'
      });

      // 4) 构造指纹并向 bd 发送加密数据以获取 rid
      const fp = WeiboRiskCookie.buildSimpleFingerprint();
      const bdPayload = await this.makeBdPayload(fp);
      const bdUrl = 'https://passport.weibo.com/sso/bd';
      logger.info('POST bd ->', bdUrl);
      const bdRes = await axios.post(bdUrl, querystring.stringify({ data: bdPayload, from: 'android-visitor' }), {
        jar,
        withCredentials: true,
        headers: WeiboRiskCookie.getHeadersForStep(5),
        responseType: 'text'
      });

      let bdJson: any = null;
      try {
        bdJson = typeof bdRes.data === 'string' ? JSON.parse(bdRes.data) : bdRes.data;
      } catch (e) {
        console.warn('无法直接解析 bd 返回，尝试宽松解析：', bdRes.data.slice ? bdRes.data.slice(0, 200) : bdRes.data);
        const m = String(bdRes.data).match(/\{[\s\S]*\}/);
        if (m) {
          try {
            bdJson = JSON.parse(m[0]);
          } catch (e2) {}
        }
      }
      if (!bdJson || !bdJson.data || !bdJson.data.rid) {
        console.warn('bd 未返回 rid，返回内容：', bdRes.data);
      }
      const rid = bdJson && bdJson.data ? bdJson.data.rid : Date.now().toString();
      logger.info('got rid:', rid);

      // 5) 查询是否已有 tid cookie
      let tid = WeiboRiskCookie.extractTidFromJarSync(jar);
      logger.info('existing tid cookie:', tid || '(none)');

      // 6) POST 到 genvisitor2（最终获取 cookie）
      const genUrl = 'https://visitor.passport.weibo.cn/visitor/genvisitor2';
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
      logger.info('POST genvisitor2 ->', genUrl, genParams);
      const genRes = await axios.post(genUrl, querystring.stringify(genParams), {
        jar,
        withCredentials: true,
        headers: WeiboRiskCookie.getHeadersForStep(6, `${enterUrl}?_rand=${rand}`),
        responseType: 'text'
      });

      const parsed = WeiboRiskCookie.parseCallbackJs(genRes.data);
      if (!parsed) {
        console.warn('无法解析 genvisitor2 返回（非标准 JSONP），原文片段：', String(genRes.data).slice(0, 500));
      } else {
        logger.info('genvisitor2 parsed:', parsed);
        if (parsed.retcode === 20000000 && parsed.data && parsed.data.tid) {
          const tidVal = parsed.data.tid;
          await jar.setCookie(`tid=${tidVal}; Domain=.weibo.cn; Path=/`, START_URL);
          logger.info('got tid from genvisitor2:', tidVal);
        }
      }

      // 读取所有 cookie（跨域）
      const allCookies: tough.Cookie[] = await new Promise((resolve, reject) => {
        jar.store.getAllCookies((err, cookies) => {
          if (err) reject(err);
          else resolve(cookies || []);
        });
      });
      // 遍历并复制到 m.weibo.cn
      allCookies.forEach(async cookie => {
        if (cookie.domain === 'weibo.cn') {
          const newCookieStr = `${cookie.key}=${cookie.value}; Domain=.weibo.cn; Path=${cookie.path}; Expires=${cookie.expires}`;
          await jar.setCookie(newCookieStr, 'https://m.weibo.cn');
        }
      });
      logger.info('cookies in jar (all domains):');
      allCookies.forEach(c => {
        logger.info(` - ${c.key} = ${c.value}; domain=${c.domain}; path=${c.path}; hostOnly=${!!c.hostOnly}; secure=${!!c.secure}; httpOnly=${!!c.httpOnly}`);
      });
      // 7) 输出并持久化当前 cookie（包含所有域名）
      await this.saveCookiesToRedis(jar);
      logger.info('完成。注意：真实成功依赖服务器对指纹/行为数据的校验，可能需增强 fingerprint 与行为模拟。');
    } catch (err) {
      console.error('error:', err);
    }
  }

  async getSessionCookieJar() {
    return this.cookieJar;
  }
  /**
   * 简单策略：优先从 Redis 读取长期 cookie（如 SUP/SUBP），若缺失则触发完整获取流程
   * */
  async ensureLongLivedCookies(jar: tough.CookieJar) {
    // 常见域名为 .weibo.cn 或 m.weibo.cn，根据实际情况检查
    const supKey1 = `${this.prefix}:weibo.com:SUP`;
    const subpKey1 = `${this.prefix}:weibo.com:SUBP`;
    const supKey2 = `${this.prefix}:weibo.cn:SUP`;
    const subpKey2 = `${this.prefix}:weibo.cn:SUBP`;

    const sup = (await Redis.get(supKey1)) || (await Redis.get(subpKey1));
    const subp = (await Redis.get(supKey2)) || (await Redis.get(subpKey2));

    if (sup || subp) {
      // 直接把 Redis 的所有 cookie 恢复到 jar（包含 SUP/SUBP）
      await this.loadCookiesFromRedis(jar);
      return true;
    } else if (!sup || !subp) {
      // 缺少长期 cookie：返回 false，调用方需执行完整流程生成并持久化
      await this.getNewSessionCookie();
      return false;
    }
  }
  /** 从 Redis 恢复 Cookie 到 CookieJar */
  async loadCookiesFromRedis(jar: tough.CookieJar) {
    const pattern = `${this.prefix}:*:*`;
    // 第一步：扫描并迁移没有前导点的 domain 键（如 weibo.cn -> .weibo.cn）
    let keys = await Redis.keys(pattern);
    for (const key of keys) {
      if (key.endsWith(':meta')) continue;
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
            if (metaRaw) await Redis.set(`${newKey}:meta`, metaRaw, { EX: ttl });
          } else {
            await Redis.set(newKey, value);
            if (metaRaw) await Redis.set(`${newKey}:meta`, metaRaw);
          }
          // 删除旧键和旧元数据
          await Redis.del(key);
          await Redis.del(metaKey);
          logger.info(`Migrated cookie key "${key}" -> "${newKey}".`);
        } catch (e) {
          logger.warn('Failed to migrate redis cookie key:', key, e);
        }
      }
    }

    // 重新获取 keys，确保后续都是规范域名
    keys = await Redis.keys(pattern);

    for (const key of keys) {
      if (key.endsWith(':meta')) continue; // 跳过 meta 键
      const value = await Redis.get(key);
      if (value == null) continue;

      // 解析 key 获取 name 和 domain
      const parts = key.split(':');
      const name = parts.pop(); // Cookie 的 key
      const domainRaw = parts.pop() || ''; // 可能已经是 .weibo.cn 或 .m.weibo.cn 等
      const domain = domainRaw.startsWith('.') ? domainRaw : `.${domainRaw}`; // 统一为带前导点

      // 获取元数据
      const metaKey = `${key}:meta`;
      const metaRaw = await Redis.get(metaKey);
      let meta: any = {};
      try {
        meta = metaRaw ? JSON.parse(metaRaw) : {};
      } catch (e) {
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
      if (meta.httpOnly) cookieStr += ' HttpOnly;';
      if (meta.secure) cookieStr += ' Secure;';

      try {
        // 动态生成 URL，host 去掉前导点
        const protocol = meta.secure ? 'https' : 'http';
        const host = domain.startsWith('.') ? domain.slice(1) : domain;
        const url = `${protocol}://${host}${path}`;

        // 设置 Cookie 到 jar
        await jar.setCookie(cookieStr, url);
        logger.info(`Restored cookie "${name}" for domain "${domain}" and path "${path}".`);
      } catch (e) {
        console.warn('Failed to restore cookie:', cookieStr, e);
      }
    }
  }

  /**
   * 将 CookieJar 中的所有 Cookie 同步到 Redis
   */
  async saveCookiesToRedis(jar: tough.CookieJar) {
    // 获取所有 Cookie
    this.cookieJar = jar;
    const allCookies: tough.Cookie[] = await new Promise((resolve, reject) => {
      jar.store.getAllCookies((err, cookies) => {
        if (err) {
          reject(err);
        } else {
          resolve(cookies || []);
        }
      });
    });

    for (const cookie of allCookies) {
      if (!cookie) continue; // 跳过无效的 Cookie
      if (typeof cookie.value === 'string' && cookie.value.toLowerCase() === 'deleted') continue; // 跳过被删除的 Cookie

      // 规范 domain 为带前导点，避免子域不可见的问题
      const domainKey = cookie.domain ? (cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`) : '.weibo.cn';
      // 构造 Redis 键
      const redisKey = `${this.prefix}:${domainKey}:${cookie.key}`;

      // 计算 TTL（秒）
      let ttl: number = 0;
      const ttlInMs = cookie.TTL ? cookie.TTL() : 0; // TTL 返回毫秒，可能不存在
      if (ttlInMs > 0) {
        ttl = Math.floor(ttlInMs / 1000);
      } else if (ttlInMs === 0) {
        // 已过期，跳过
        continue;
      }

      // 构造元数据
      const meta = JSON.stringify({
        path: cookie.path,
        httpOnly: !!cookie.httpOnly,
        secure: !!cookie.secure
      });

      // 写入 Redis（使用 TTL 时一并写 meta）
      try {
        if (ttl && ttl > 0) {
          await Redis.set(redisKey, cookie.value, { EX: ttl });
          await Redis.set(`${redisKey}:meta`, meta, { EX: ttl });
        } else {
          await Redis.set(redisKey, cookie.value);
          await Redis.set(`${redisKey}:meta`, meta);
        }
      } catch (error: unknown) {
        logger.warn('Failed to save cookie to Redis:', redisKey, error);
      }
    }
  }

  /**
   * 删除所有 Cookie 并同步清除 Redis 缓存
   */
  async resetCookiesAndRedis() {
    try {
      // 1. 清空 CookieJar 中的所有 Cookie
      const allCookies: tough.Cookie[] = await new Promise((resolve, reject) => {
        this.cookieJar.store.getAllCookies((err, cookies) => {
          if (err) reject(err);
          else resolve(cookies || []);
        });
      });

      if (allCookies.length > 0) {
        for (const cookie of allCookies) {
          await this.cookieJar.setCookie(`${cookie.key}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`, `https://${cookie.domain}${cookie.path}`);
        }
        console.log('All cookies in CookieJar have been cleared.');
      } else {
        console.log('No cookies found in CookieJar to clear.');
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
          console.log(`Deleted ${keys.length} cookies and their metadata from Redis.`);
        }
      } else {
        console.log('No cookies found in Redis to clear.');
      }
      this.cookieJar = new tough.CookieJar(); // 清空 CookieJar
      await this.initialize(); // 重新初始化 CookieJar
      console.log('Cookie reset completed successfully.');
    } catch (error) {
      console.error('Error resetting cookies and Redis cache:', error);
      throw error;
    }
  }
  //** 从 CookieJar 中获取指定 key 的值 */
  async getCookieValueByKeyFromString(jar: tough.CookieJar, key: string, url: string): Promise<string | null> {
    try {
      // 获取与 URL 匹配的所有 Cookie 字符串
      const cookieString = await new Promise<string>((resolve, reject) => {
        jar.getCookieString(url, (err, cookieString) => {
          if (err) reject(err);
          else resolve(cookieString || '');
        });
      });

      // 解析目标 key 的值
      const match = cookieString.match(new RegExp(`${key}=([^;]+)`));
      return match ? match[1] : null;
    } catch (err) {
      console.error(`Error fetching cookie with key "${key}":`, err);
      return null;
    }
  }

  /**
   * *******************************************************************
   * 微博登录
   * *******************************************************************
   */

  /**查看当前ck是否登录*/
  async checkWeiboLogin(e: any) {
    const url = 'https://m.weibo.cn/api/config';
    const jar = await WeiboCookieManager.getSessionCookieJar();
    const X_XSRF_TOKEN = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url);

    const resData = (
      await axios(url, {
        method: 'GET',
        jar,
        withCredentials: true,
        headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
          'X-XSRF-TOKEN': `${X_XSRF_TOKEN}`,
          'Host': 'm.weibo.cn',
          'Referer': 'https://m.weibo.cn'
        })
      })
    ).data as {
      preferQuickapp?: number;
      data?: {
        login?: boolean;
        st?: string;
        user_token?: string;
        uid?: string;
      };
      ok: 1;
    };

    global?.logger?.debug(`微博验证登录状态:${JSON.stringify(resData)}`);

    if (resData.data?.login === false) {
      e.reply('微博账号未登录。\n注意：登录后如果检测动态频率设置过高可能会被微博风控/封号，请谨慎使用！');
      return false;
    } else if (resData.data?.login === true) {
      const uid = Number(resData.data.uid);
      const user_token = resData.data.user_token;

      const url_1 = `https://m.weibo.cn/profile/info?uid=${uid}`;
      const X_XSRF_TOKEN_1 = await WeiboCookieManager.getCookieValueByKeyFromString(jar, 'X-XSRF-TOKEN', url_1);

      const infoRes = (await axios(url_1, {
        method: 'GET',
        jar,
        withCredentials: true,
        headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
          'X-XSRF-TOKEN': `${X_XSRF_TOKEN_1}`,
          'Host': 'm.weibo.cn',
          'x-h5-user-token': `${user_token}`,
          'Referer': `https://m.weibo.cn/profile/${uid}?user_token=${user_token}`
        })
      })) as {
        ok?: number;
        data?: {
          user?: {
            id?: number;
            screen_name?: string;
            profile_image_url?: string;
            profile_url?: string;
            close_blue_v?: boolean;
            description?: string;
            follow_me?: boolean;
            following?: boolean;
            follow_count?: number;
            followers_count?: string;
            cover_image_phone?: string;
            avatar_hd?: string;
            statuses_count?: number;
            verified?: boolean;
            verified_type?: number;
            gender?: string;
            mbtype?: number;
            svip?: number;
            urank?: number;
            mbrank: number;
            followers_count_str?: string;
            verified_reason?: string;
            like?: boolean;
            like_me?: boolean;
            special_follow?: boolean;
            user_token?: string;
          };
          statuses?: any[];
          more?: string;
          fans?: string;
          follow?: string;
          button?: {
            type?: string;
            name?: string;
            sub_type?: number;
            params?: {
              uid?: string;
            };
          };
        };
      };
      let uname = infoRes.data?.user?.screen_name;
      let mid = infoRes.data?.user?.id;
      let follow_count = infoRes.data?.user?.follow_count;
      let svip = infoRes.data?.user?.svip;

      e.reply(`~微博账号已登陆~\n昵称：${uname}\nuid：${mid}\nsvip等级：${svip}\n关注：${follow_count}`);
      return true;
    }
  }

  /**
   * 扫码登录流程
   */
  async weiboLogin(e: any) {
    const isLogin = await this.checkWeiboLogin(e);
    if (!isLogin) {
      const tokenKey = await this.applyLoginQRCode(e);
      if (tokenKey && tokenKey.rid) {
        const isSuccessLogin = await this.pollLoginQRCode(e, tokenKey.qrid, tokenKey.rid, tokenKey.X_CSRF_TOKEN);
        return isSuccessLogin;
      }
    }
  }
  /**
   * 登录前访问bd接口获取rid
   * @param {string} X_CSRF_TOKEN - X_CSRF_TOKEN
   * @returns {Promise<JSON>} 服务器响应结果
   */
  async getRidFromBd(X_CSRF_TOKEN: string) {
    try {
      // 构造指纹并向 bd 发送加密数据以获取 rid
      const fp = WeiboRiskCookie.buildSimpleFingerprint();
      const bdPayload = await this.makeBdPayload(fp);
      const bdUrl = 'https://passport.weibo.com/sso/bd';
      logger.info('POST bd ->', bdUrl);

      const bdRes = await axios.post(bdUrl, querystring.stringify({ data: bdPayload, from: 'weibo' }), {
        withCredentials: true,
        headers: lodash.merge(WeiboApi.WEIBO_GET_BD_TOKEN_HEADERS, {
          Origin: 'https://passport.weibo.com',
          Cookie: `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
        }),
        responseType: 'text'
      });

      // 尝试直接解析为 JSON
      let parsedData: { retcode?: number; msg?: string; data?: { rid?: string } } = {};
      if (typeof bdRes.data === 'string') {
        try {
          parsedData = JSON.parse(bdRes.data);
        } catch (e) {
          console.warn('微博登录前访问bd接口：无法直接解析 bd 返回，尝试宽松解析：', bdRes.data.slice ? bdRes.data.slice(0, 200) : bdRes.data);
          // 宽松解析逻辑
          const match = String(bdRes.data).match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsedData = JSON.parse(match[0]);
            } catch (e2) {
              console.warn('宽松解析失败，返回内容：', bdRes.data);
            }
          }
        }
      } else if (typeof bdRes.data === 'object') {
        parsedData = bdRes.data;
      }

      // 检查是否包含有效的 rid
      if (parsedData.retcode === 20000000 && parsedData.data?.rid) {
        return parsedData; // 返回完整的解析结果
      } else {
        console.warn(`微博登录前访问bd接口：返回异常，retcode=${parsedData.retcode}, msg=${parsedData.msg}`);
        return { retcode: parsedData.retcode || -1, msg: parsedData.msg || '无效响应', data: {} };
      }
    } catch (error) {
      console.error('微博登录前访问bd接口：发生异常', error);
      return { retcode: -1, msg: '网络请求或解析失败', error: String(error), data: {} };
    }
  }

  /**申请登陆二维码(web端) */
  async applyLoginQRCode(e: any) {
    const response = await fetch('https://passport.weibo.com/sso/signin?entry=wapsso&source=wapssowb&url=https://m.weibo.cn/', {
      method: 'GET',
      headers: lodash.merge(WeiboApi.WEIBO_GET_X_CSRF_TOKEN_HEADERS, { Host: 'passport.weibo.com' }),
      redirect: 'follow'
    });
    const setCookie = response.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/X-CSRF-TOKEN=([^;]+)/);
    const X_CSRF_TOKEN = tokenMatch ? tokenMatch[1].replace(/X-CSRF-TOKEN=/g, '') : null;

    if (X_CSRF_TOKEN) {
      const resData = (await fetch('https://passport.weibo.com/sso/v2/qrcode/image?entry=wapsso&size=180', {
        method: 'GET',
        headers: lodash.merge(WeiboApi.WEIBO_LOGIN_QR_CODE_HEADERS, {
          'Host': 'passport.weibo.com',
          'X-CSRF-TOKEN': X_CSRF_TOKEN,
          'Cookie': `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
        }),
        redirect: 'follow'
      }).then(res => res.json())) as {
        retcode?: number;
        msg?: string;
        data?: {
          qrid?: string;
          image?: string;
        };
      };

      if (resData?.retcode === 20000000) {
        const qrid = resData?.data?.qrid;
        const qrcodeUrl = resData?.data?.image;

        let msg: any[] = [];
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

          const ridData = (await this.getRidFromBd(X_CSRF_TOKEN)) as { retcode?: number; msg?: string; data?: { rid?: string } };
          if (ridData.retcode === 20000000) {
            const rid = ridData.data?.rid;
            const arrayBuffer = await imgResponse.arrayBuffer();
            msg.push(Segment.image(Buffer.from(arrayBuffer)));
            e.reply('请在3分钟内扫码以完成微博登陆绑定');
            e.reply(msg);
            logger.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 浏览器访问此URL查看二维码并扫码`);
            logger.info(`优纪插件: 微博登陆二维码URL: ${qrcodeUrl}`);

            return { qrid, rid, X_CSRF_TOKEN };
          } else {
            logger.error('微博登录：获取rid失败', ridData);
            e.reply(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}，\n接口逆向进度受阻，未完成，无法登录。\n已自动切换启用访客ck`);
            throw new Error(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}，\n接口逆向进度受阻，未完成，无法登录。\n已自动切换启用访客ck`);
          }
        }
      } else {
        e.reply(`获取微博登录二维码失败: ${JSON.stringify(resData)}`);
        throw new Error(`获取微博登录二维码失败: ${JSON.stringify(resData)}`);
      }
    } else {
      logger.error('微博登录：获取X_CSRF_TOKEN失败');
      return false;
    }
  }

  /**处理扫码结果 */
  async pollLoginQRCode(e: any, qrid: string, rid: string, X_CSRF_TOKEN: string) {
    const url = `https://passport.weibo.com/sso/v2/qrcode/check?entry=wapsso&source=wapssowb&url=https://m.weibo.cn/&qrid=${qrid}&rid=${rid}&ver=20250520`;
    const response: any = await axios(url, {
      method: 'GET',
      headers: lodash.merge(WeiboApi.WEIBO_POLL_LOGIN_STATUS_HEADERS, {
        'X-CSRF-TOKEN': X_CSRF_TOKEN,
        'Cookie': `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
      }),
      maxRedirects: 0
    });

    if (!response) {
      throw new Error(`处理B站登录token网络请求失败，状态码: ${response.status}`);
    }

    const data = (await response.data) as {
      retcode?: number;
      msg?: string;
      data?: {
        url?: string;
      };
    };

    if (data?.retcode === 20000000) {
      // 获取 cookie url
      // 获取 cookie url
      let currentUrl = data?.data?.url;
      const jar = new tough.CookieJar();
      //  保存初始状态 Cookie
      const initialCookies = await new Promise<tough.Cookie[]>((resolve, reject) => {
        jar.store.getAllCookies((err, cookies) => {
          if (err) reject(err);
          else resolve(cookies || []);
        });
      });

      if (currentUrl) {
        // 处理 5 次重定向
        for (let i = 0; i < 4; i++) {
          try {
            // 确保 currentUrl 不为 undefined
            if (!currentUrl) {
              throw new Error('currentUrl 不能为空');
            }
            const resp = await axios.get(currentUrl, {
              method: 'GET',
              jar,
              withCredentials: true,
              headers: lodash.merge(WeiboApi.WEIBO_COOKIE_HEADERS, {
                Referer: 'https://passport.weibo.com/'
              }),
              maxRedirects: 0
            });

            // 如果响应状态码为 302，提取 location 并继续
            if (resp.status === 302) {
              currentUrl = resp.headers['location'];
              continue;
            }
          } catch (error) {
            // 类型守卫：确认 error 是 AxiosError 类型
            if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError; // 类型断言
              if (axiosError.response && axiosError.response.status === 302) {
                console.log('捕获到 302 重定向:', axiosError.response.data);
              }
            } else {
              console.error('非 Axios 错误:', error);
            }
          }
        }
        // 获取请求完成后的 Cookie 状态
        const updatedCookies = await new Promise<tough.Cookie[]>((resolve, reject) => {
          jar.store.getAllCookies((err, cookies) => {
            if (err) reject(err);
            else resolve(cookies || []);
          });
        });

        // 构建初始状态的 Map
        const initialCookieMap = new Map(initialCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 构建更新后的 Map
        const updatedCookieMap = new Map(updatedCookies.map(c => [`${c.key}:${c.domain}`, c]));
        // 比较两个 Map
        let hasUpdates = false; // 标记是否有 Cookie 更新

        for (const [key, updatedCookie] of updatedCookieMap.entries()) {
          const initialCookie = initialCookieMap.get(key);
          if (!initialCookie || initialCookie.value !== updatedCookie.value) {
            logger.info(`Weibo Cookie ${updatedCookie.key} was updated.`);
            hasUpdates = true; // 标记有更新
          }
        }
        // 如果有更新，统一保存到 Redis
        if (hasUpdates) {
          logger.info('weibo: Detected updates in cookies, saving all cookies to Redis...');
          logger.info('weibo: cookies in jar (all domains):');
          updatedCookies.forEach(c => {
            logger.info(
              ` - ${c.key} = ${c.value}; domain=${c.domain}; path=${c.path}; hostOnly=${!!c.hostOnly}; secure=${!!c.secure}; httpOnly=${!!c.httpOnly}`
            );
          });
          await WeiboCookieManager.saveCookiesToRedis(jar); // 统一保存
          await e.reply(`~微博登陆成功~`);
          return true;
        } else {
          await e.reply(`获取微博登录Cookie失败`);
          return false;
        }
      }
    } else if (data?.retcode === 50114001) {
      // 未扫码
      // 继续轮询
      await new Promise(resolve => setTimeout(resolve, 2000));
      global?.logger?.mark(`优纪插件：扫码微博登录：未扫码，轮询中...`);
      return this.pollLoginQRCode(e, qrid, rid, X_CSRF_TOKEN);
    } else if (data?.retcode === 50114002) {
      // 已扫码未确认
      // 继续轮询
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.pollLoginQRCode(e, qrid, rid, X_CSRF_TOKEN);
    } else if (data?.retcode === 50114003) {
      // 二维码已失效
      e.reply('微博登陆二维码已失效');
      return false;
    } else {
      e.reply('处理微博登录扫码结果出错');
      throw new Error(`处理微博登录扫码结果出错: ${JSON.stringify(data)}`);
    }
  }
}
const WeiboCookieManager = new WeiboRiskCookie();
export default WeiboCookieManager;
