class BiliApi {
    static BILIBIL_API = {
        biliDynamicInfoList: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space`,
        biliUpFollowFans: `https://api.bilibili.com/x/relation/stat`,
        biliSpaceUserInfo: `https://api.bilibili.com/x/space/acc/info`,
        biliSpaceUserInfoWbi: `https://api.bilibili.com/x/space/wbi/acc/info`,
        biliSearchUp: `https://api.bilibili.com/x/web-interface/search/type`,
        biliSearchUpWbi: `https://api.bilibili.com/x/web-interface/wbi/search/type`,
        biliLiveStatus: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
        biliCard: 'https://api.bilibili.com/x/web-interface/card',
        biliStat: 'https://api.bilibili.com/x/relation/stat',
        biliLiveUserInfo: 'https://api.live.bilibili.com/live_user/v1/Master/info',
        biliOpusDetail: 'https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail'
    };
    static BILIBILI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    static BILIBILI_HEADERS = {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,en-US;q=0.5',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Cookie': '',
        'pragma': 'no-cache',
        'Cache-control': 'max-age=0',
        'DNT': '1',
        'Sec-GPC': '1',
        'sec-ch-ua-platform': '',
        'sec-ch-ua-mobile': '?0',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-User': '?0',
        'Priority': 'u=4',
        'TE': 'trailers',
        'User-Agent': this.BILIBILI_USER_AGENT
    };
    static BIlIBILI_LOGIN_HEADERS = {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,en-US;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'DNT': '1',
        'Sec-GPC': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers'
    };
    static BILIBILI_ARTICLE_HEADERS = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
        'Accept-Language': 'zh-CN,en-US;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-type': 'text/html; charset=utf-8',
        'Cookie': '',
        'pragma': 'no-cache',
        'Cache-control': 'no-cache',
        'DNT': '1',
        'Sec-GPC': '1',
        'sec-ch-ua-mobile': '?0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': this.BILIBILI_USER_AGENT
    };
    static BILIBILI_DYNAMIC_SPACE_HEADERS = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'zh-CN,en-US;q=0.5',
        'Connection': 'keep-alive',
        'Priority': 'u=0, i',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-GPC': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': this.BILIBILI_USER_AGENT
    };
}

export { BiliApi };
