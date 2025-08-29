import WeiboApi from '@/models/weibo/weibo.main.api';
import { getRidFromBd } from '@/models/weibo/weibo.risk.bd.rid';
import { Redis, Segment, logger } from '@/utils/host';
import { parse, serialize } from 'cookie';
import lodash from 'lodash';
import moment from 'moment';
import fetch from 'node-fetch';

export class WeiboMainModels {
  /**
   * *******************************************************************
   * Login 相关
   * *******************************************************************
   */
  /**申请登陆二维码(web端) */
  static async applyLoginQRCode(e: any) {
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
          const ridData = await getRidFromBd(X_CSRF_TOKEN);
          if (ridData?.retcode === 20000000) {
            const rid = ridData?.data?.rid;
            const arrayBuffer = await imgResponse.arrayBuffer();
            msg.push(Segment.image(Buffer.from(arrayBuffer)));
            e.reply('请在3分钟内扫码以完成微博登陆绑定');
            e.reply(msg);
            logger.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 浏览器访问此URL查看二维码并扫码`);
            logger.info(`优纪插件: 微博登陆二维码URL: ${qrcodeUrl}`);

            return { qrid, rid, X_CSRF_TOKEN };
          } else {
            logger.error('微博登录：获取rid失败');
            e.reply(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}`);
            throw new Error(`获取微博登录rid密钥失败: ${JSON.stringify(ridData)}`);
          }
        }
      } else {
        e.reply(`获取微博登录二维码失败: ${JSON.stringify(resData)}，\n接口逆向进度受阻，未完成，无法登录。\n无妨，已切换启用临时ck`);
        throw new Error(`获取微博登录二维码失败: ${JSON.stringify(resData)}，\n接口逆向进度受阻，未完成，无法登录。\n无妨，已切换启用临时ck`);
      }
    } else {
      logger.error('微博登录：获取X_CSRF_TOKEN失败');
      return false;
    }
  }

  /**处理扫码结果 */
  static async pollLoginQRCode(e: any, qrid: string, rid: string, X_CSRF_TOKEN: string): Promise<string | null> {
    const url = `https://passport.weibo.com/sso/v2/qrcode/check?entry=wapsso&source=wapssowb&url=https://m.weibo.cn/&qrid=${qrid}&rid=${rid}&ver=20250520`;
    const response = await fetch(url, {
      method: 'GET',
      headers: lodash.merge(WeiboApi.WEIBO_POLL_LOGIN_STATUS_HEADERS, {
        'X-CSRF-TOKEN': X_CSRF_TOKEN,
        'Cookie': `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
      }),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`处理B站登录token网络请求失败，状态码: ${response.status}`);
    }

    const data = (await response.json()) as {
      retcode?: number;
      msg?: string;
      data?: {
        url?: string;
      };
    };

    if (data?.retcode === 20000000) {
      // 获取 cookie url
      const getCookieUrl = data?.data?.url;
      if (getCookieUrl) {
        const CookieResp = await fetch(getCookieUrl, {
          method: 'GET',
          headers: lodash.merge(WeiboApi.WEIBO_COOKIE_HEADERS, { Cookie: `X-CSRF-TOKEN=${X_CSRF_TOKEN}` }),
          redirect: 'follow'
        });
        const setCookie = CookieResp.headers.get('set-cookie');
        if (setCookie) {
          await this.saveLoginCookie(e, setCookie);
          e.reply(`~微博登陆成功~`);
          return setCookie;
        } else {
          e.reply(`获取微博登录Cookie失败: ${JSON.stringify(CookieResp.headers)}`);
          return null;
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
      return null;
    } else {
      e.reply('处理微博登录扫码结果出错');
      throw new Error(`处理微博登录扫码结果出错: ${JSON.stringify(data)}`);
    }
    return null;
  }

  /**查看app扫码登陆获取的ck的有效状态*/
  static async checkWeiboLogin(e: any) {
    const LoginCookie = await this.readLoginCookie();
    if (String(LoginCookie).trim().length < 10) {
      e.reply('啊咧？微博登录CK呢？哦，没 #扫码微博登录# 或缓存失效了啊，那没事了。');
      return;
    } else {
      const { cookie, mark } = await WeiboMainModels.readSyncCookie();

      let COOKIE: string = '',
        XSRF_TOKEN: string = '';

      if (String(cookie).includes('XSRF-TOKEN')) {
        COOKIE = cookie;
        XSRF_TOKEN = await WeiboMainModels.readSavedCookieItems(cookie, ['XSRF-TOKEN'], false);
      }
      const resData = (await fetch('https://m.weibo.cn/api/config', {
        method: 'GET',
        headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
          'X-XSRF-TOKEN': `${XSRF_TOKEN}`,
          'Cookie': `${COOKIE}`,
          'Host': 'm.weibo.cn',
          'Referer': 'https://m.weibo.cn'
        }),
        redirect: 'follow'
      }).then(res => res.json())) as {
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

      if (resData.data?.login === true) {
        const uid = Number(resData.data.uid);
        const user_token = resData.data.user_token;
        const infoRes = (await fetch(`https://m.weibo.cn/profile/info?uid=${uid}`, {
          method: 'GET',
          headers: lodash.merge(WeiboApi.WEIBO_HEADERS, {
            'X-XSRF-TOKEN': `${XSRF_TOKEN}`,
            'Cookie': `${COOKIE}`,
            'Host': 'm.weibo.cn',
            'x-h5-user-token': `${user_token}`,
            'Referer': `https://m.weibo.cn/profile/${uid}?user_token=${user_token}`
          }),
          redirect: 'follow'
        }).then(res => res.json())) as {
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
        const cookie = await this.readLoginCookie();
        const ALF = this.extractALFValue(cookie);
        let TLL: number = 0;
        if (ALF) {
          TLL = Number(ALF) * 1000;
        }
        const EXP_TIME = moment(TLL * 1000).format('YYYY年MM月DD日 HH:mm:ss');

        e.reply(`~微博账号已登陆~\n昵称：${uname}\nuid：${mid}\nsvip等级：${svip}\n关注：${follow_count}\n登录失效时间：${EXP_TIME}`);
      } else {
        // 处理其他情况
        e.reply('意外情况，未能获取微博登录ck的有效状态');
        return;
      }
    }
  }

  /** 获取ALF值*/
  static extractALFValue(cookieString: string): number | null {
    const match = cookieString.match(/ALF=(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }
  /**
   * *******************************************************************
   * cookie相关
   * *******************************************************************
   */

  /**保存扫码登录的weiboLoginCK*/
  static async saveLoginCookie(e: any, weiboLoginCk: string) {
    if (weiboLoginCk && weiboLoginCk.length > 0) {
      const weiboLoginCkKey = 'Yz:yuki:weibo:loginCookie';
      Redis.set(weiboLoginCkKey, weiboLoginCk, { EX: 3600 * 24 * 300 });
    } else {
      e.reply('扫码超时');
    }
  }
  /** 读取扫码登陆后缓存的weiboCookie */
  static async readLoginCookie() {
    const CK_KEY = 'Yz:yuki:weibo:loginCookie';
    const tempCk = await Redis.get(CK_KEY);

    return tempCk ? tempCk : '';
  }
  /** 读取手动绑定的weibo CK */
  static async readLocalBiliCk() {
    const CK_KEY = 'Yz:yuki:weibo:localCookie';
    const tempCk = await Redis.get(CK_KEY);

    return tempCk ? tempCk : '';
  }

  /** 覆盖保存手动获取绑定的weibo ck */
  static async saveLocalBiliCk(data: any) {
    const weiboLoginCkKey = 'Yz:yuki:weibo:localCookie';
    Redis.set(weiboLoginCkKey, data, { EX: 3600 * 24 * 300 });
  }
  /** 读取扫码登陆后缓存的weibo cookie的有效时间 */
  static async readLoginCookieTTL() {
    const CK_KEY = 'Yz:yuki:weibo:loginCookie';
    const tempCk = await Redis.get(CK_KEY);
    if (tempCk) {
      const LoginCookieTTL = await Redis.ttl(CK_KEY);
      return LoginCookieTTL;
    } else {
      return -2;
    }
  }
  /** 综合获取ck，返回优先级：localCK > loginCK */
  static async readSyncCookie() {
    const localCk = await this.readLocalBiliCk();
    const loginCk = await this.readLoginCookie();

    const validCk = (ck: string) => ck?.includes('SUB=') && ck?.includes('SUBP=');

    if (validCk(localCk)) {
      return { cookie: localCk, mark: 'localCk' };
    } else if (validCk(loginCk)) {
      return { cookie: loginCk + ';', mark: 'loginCk' };
    } else {
      return { cookie: '', mark: 'ckIsEmpty' };
    }
  }

  /**
   * 综合读取、筛选 传入的或本地或redis存储的cookie的item
   * @param {string} mark 读取存储的CK类型，'localCK'  'loginCK' 或传入值 'xxx'并进行筛选
   * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['XSRF-TOKEN', 'SUB', 'SUBP', 'SRF', 'SCF', 'SRT', ' _T_WM', 'M_WEIBOCN_PARAMS', 'SSOLoginState','ALF']
   * @param {boolean} isInverted 控制正取和反取，true为反取，默认为false正取
   * @returns {string}
   **/
  static async readSavedCookieItems(mark: string, items: Array<string>, isInverted = false): Promise<string> {
    let ckString: string;

    switch (mark) {
      case 'localCK':
        ckString = await this.readLocalBiliCk();
        break;
      case 'loginCK':
        ckString = await this.readLoginCookie();
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

    const cookiePairs =
      String(Wck)
        .trim()
        .match(/(\w+)=([^;|,]+)/g) //正则 /(\w+)=([^;]+);/g 匹配 a=b 的内容，并分组为 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符
        ?.map(match => match.split('='))
        .filter(([key, value]) => (isInverted ? !items.includes(key) : items.includes(key)) && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join(';') || '';

    return cookiePairs;
  }

  // 取反读取ck、筛选 传入的或本地或redis存储的cookie的item
  static async readSavedCookieOtherItems(mark: string, items: Array<string>) {
    return await this.readSavedCookieItems(mark, items, true);
  }

  /**更新cookie */
  static async updateCookieWithSetCookie(setCookieHeaders: string[], mark: string): Promise<void> {
    // 1. 读取当前保存的 Cookie
    const currentCookie = await this.readLoginCookie();
    // 使用 Record<string, string | undefined> 类型接收解析结果
    const cookieObj: Record<string, string | undefined> = currentCookie ? parse(currentCookie) : {};

    // 2. 解析 Set-Cookie 响应头并更新 Cookie 对象
    setCookieHeaders.forEach(header => {
      const parsedCookie = parse(header.split(';')[0]);
      Object.entries(parsedCookie).forEach(([key, value]) => {
        if (value === 'deleted') {
          delete cookieObj[key];
        } else if (value !== undefined) {
          // 添加类型守卫
          cookieObj[key] = value;
        }
      });
    });

    // 3. 过滤掉 undefined 值并重新组合为字符串
    const validCookies: { [key: string]: string } = {};
    Object.entries(cookieObj).forEach(([key, value]) => {
      if (value !== undefined) {
        validCookies[key] = value;
      }
    });

    const updatedCookie = Object.entries(validCookies)
      .map(([key, value]) => serialize(key, value))
      .join('; ');

    // 4. 保存更新后的 Cookie
    if (updatedCookie) {
      let key: string = '';
      if (mark === 'loginCK') {
        key = 'Yz:yuki:weibo:loginCookie';
      } else if (mark === 'localCK') {
        key = 'Yz:yuki:weibo:localCookie';
      }
      Redis.set(key, updatedCookie, { EX: 3600 * 24 * 300 });
    }
  }
}
