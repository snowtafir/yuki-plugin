import Config from '@/utils/config';
class WeiboApi {
  weiboConfigData: any;
  USER_AGENT: string;
  WEB_USER_AGENT: string;
  constructor() {
    this.weiboConfigData = Config.getUserConfig('weibo', 'config');
    this.USER_AGENT = '';
    this.WEB_USER_AGENT = '';
    this.initUserAgent();
  }

  initUserAgent() {
    const userAgentList = this.weiboConfigData.userAgentList || [];
    if (userAgentList.length > 0) {
      const randomIndex = Math.floor(Math.random() * userAgentList.length);
      this.USER_AGENT = String(userAgentList[randomIndex]);
    }
    this.WEB_USER_AGENT = String(this.weiboConfigData.webUserAgent || this.USER_AGENT || '');
  }

  get WEIBO_API() {
    return {
      weiboGetIndex: 'https://m.weibo.cn/api/container/getIndex',
      weiboLoginState: 'https://m.weibo.cn/api/config',
      weiboProfileInfo: 'https://weibo.com/ajax/profile/info',
      weiboLogout: 'https://login.sina.com.cn/sso/logout.php?entry=miniblog&r=',
      weiboUserPage: 'https://m.weibo.cn/u/7643376782',
      weiboMobileOrigin: 'https://m.weibo.cn',
      weiboWebOrigin: 'https://weibo.com',
      weiboPassportOrigin: 'https://passport.weibo.com',
      weiboVisitorOrigin: 'https://visitor.passport.weibo.cn',
      weiboVisitorEnter: 'https://visitor.passport.weibo.cn/visitor/visitor',
      weiboVisitorMiniJs: 'https://visitor.passport.weibo.cn/js/visitor/mini_original.js?v=20161116',
      weiboVisitorUmdJs: 'https://passport.sinaimg.cn/js/fp/1.2.1.umd.js',
      weiboBd: 'https://passport.weibo.com/sso/bd',
      weiboGenVisitor: 'https://visitor.passport.weibo.cn/visitor/genvisitor2',
      weiboGenVisitorV1: 'https://visitor.passport.weibo.cn/visitor/genvisitor',
      weiboSignin: 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapssowb&url=https://m.weibo.cn/',
      weiboQrImage: 'https://passport.weibo.com/sso/v2/qrcode/image?entry=wapsso&size=180',
      weiboQrCheck: 'https://passport.weibo.com/sso/v2/qrcode/check'
    };
  }
  /**统一设置header */
  get WEIBO_HEADERS() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'MWeibo-Pwa': '1',
      'User-Agent': this.USER_AGENT
    };
  }

  get WEIBO_PROFILE_HEADERS() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,en-US;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'X-Requested-With': 'XMLHttpRequest',
      'client-version': 'v1.1.261',
      'server-version': 'v2026.11.27.1',
      'X-XSRF-TOKEN': '',
      'DNT': '1',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': '',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=0',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'TE': 'trailers',
      'User-Agent': this.WEB_USER_AGENT
    };
  }

  get WEIBO_LOGOUT_HEADERS() {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,en-US;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'DNT': '1',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': '',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Priority': 'u=0, i',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent': this.WEB_USER_AGENT
    };
  }

  get WEIBO_GET_X_CSRF_TOKEN_HEADERS() {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Priority': 'u=0, i',
      'User-agent': this.USER_AGENT
    };
  }
  get WEIBO_LOGIN_QR_CODE_HEADERS() {
    return {
      'Accept': `application/json, text/plain, */*`,
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': '',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapssowb&url=https%3A%2F%2Fm.weibo.cn%2F',
      'Cookie': '',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=0',
      'User-agent': this.USER_AGENT
    };
  }

  get WEIBO_LOGIN_QR_CODE_IMAGE_HEADERS() {
    return {
      'Accept': `image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5`,
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': 'https://passport.weibo.com/',
      'Cookie': '',
      'Sec-Fetch-Dest': 'Image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
      'Priority': 'u=4, i',
      'User-agent': this.USER_AGENT
    };
  }
  get WEIBO_GET_BD_TOKEN_HEADERS() {
    return {
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'passport.weibo.com',
      'Origin': 'https://passport.weibo.com',
      'Priority': 'u=4',
      'Referer': 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapsso&url=https%3A%2F%2Fm.weibo.cn%2F',
      'Connection': 'keep-alive',
      'Cookie': '',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-GPC': '1',
      'TE': 'trailers',
      'User-Agent': this.USER_AGENT
    };
  }
  get WEIBO_POLL_LOGIN_STATUS_HEADERS() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': '',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapssowb&url=https%3A%2F%2Fm.weibo.cn%2F',
      'Cookie': '',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'TE': 'trailers',
      'User-agent': this.USER_AGENT
    };
  }
  get WEIBO_COOKIE_HEADERS() {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,en-US;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Connection': 'keep-alive',
      'Referer': 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapsso&url=https://m.weibo.cn/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=0, i',
      'TE': 'trailers',
      'User-agent': this.USER_AGENT
    };
  }
}

export default new WeiboApi();
