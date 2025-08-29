import Config from '../../utils/config.js';

class WeiboApi {
    weiboConfigData;
    USER_AGENT;
    constructor() {
        this.weiboConfigData = Config.getUserConfig('weibo', 'config');
        this.USER_AGENT = WeiboApi.WEIBO_USER_AGENT;
        this.initialize();
    }
    static WEIBO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
    //初始化User-Agent
    async initialize() {
        await this.initUserAgent();
    }
    async initUserAgent() {
        const userAgentList = await this.weiboConfigData.userAgentList;
        if (userAgentList && userAgentList.length > 0) {
            const randomIndex = Math.floor(Math.random() * userAgentList.length);
            this.USER_AGENT = String(userAgentList[randomIndex]);
        }
    }
    get WEIBO_API() {
        return {
            weiboGetIndex: 'https://m.weibo.cn/api/container/getIndex',
            //通过关键词${upKeyword}搜索博主 parama = { q: 'Keyword'},
            weiboAjaxSearch: 'https://weibo.com/ajax/side/search'
        };
    }
    /**统一设置header */
    get WEIBO_HEADERS() {
        return {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,en-US;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'X-Requested-With': 'XMLHttpRequest',
            'MWeibo-Pwa': '1',
            'X-XSRF-TOKEN': '',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Connection': 'keep-alive',
            'User-agent': this.USER_AGENT
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
            'Referer': 'https://passport.weibo.com/sso/signin?entry=wapsso&source=wapsso&url=https%3A%2F%2Fm.weibo.cn%2F%3Fjumpfrom%3Dweibocom',
            'Cookie': '',
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
var WeiboApi$1 = new WeiboApi();

export { WeiboApi$1 as default };
