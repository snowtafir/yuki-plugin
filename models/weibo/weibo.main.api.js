import Config from '../../utils/config.js';

class WeiboApi {
    weiboConfigData;
    USER_AGENT;
    constructor() {
        this.weiboConfigData = Config.getUserConfig('weibo', 'config');
        this.USER_AGENT = WeiboApi.WEIBO_USER_AGENT;
        this.initialize();
    }
    static WEIBO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-language': 'zh-CN,zh;q=0.9',
            'Authority': 'm.weibo.cn',
            'Cache-control': 'max-age=0',
            'Sec-fetch-dest': 'empty',
            'Sec-fetch-mode': 'same-origin',
            'Sec-fetch-site': 'same-origin',
            'Upgrade-insecure-requests': '1',
            'User-agent': this.USER_AGENT
        };
    }
}
var WeiboApi$1 = new WeiboApi();

export { WeiboApi$1 as default };
