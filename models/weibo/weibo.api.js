class WeiboApi {
    static WEIBO_API = {
        weiboGetIndex: 'https://m.weibo.cn/api/container/getIndex',
        weiboAjaxSearch: 'https://weibo.com/ajax/side/search'
    };
    static WEIBO_HEADERS = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-language': 'zh-CN,zh;q=0.9',
        'Authority': 'm.weibo.cn',
        'Cache-control': 'max-age=0',
        'Sec-fetch-dest': 'empty',
        'Sec-fetch-mode': 'same-origin',
        'Sec-fetch-site': 'same-origin',
        'Upgrade-insecure-requests': '1',
        'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'
    };
}

export { WeiboApi };
