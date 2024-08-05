class BiliApi {
    static BILIBIL_API = {
        biliDynamicInfoList: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space`,
        biliUpFollowFans: `https://api.bilibili.com/x/relation/stat`,
        biliSpaceUserInfo: `https://api.bilibili.com/x/space/acc/info`,
        biliSpaceUserInfoWbi: `https://api.bilibili.com/x/space/wbi/acc/info`,
        biliSearchUp: `https://api.bilibili.com/x/web-interface/search/type`,
        biliLiveStatus: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
        biliCard: "https://api.bilibili.com/x/web-interface/card",
        biliStat: "https://api.bilibili.com/x/relation/stat",
        biliLiveUserInfo: "https://api.live.bilibili.com/live_user/v1/Master/info",
        biliOpusDetail: "https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail",
    };
    static BILIBILI_HEADERS = {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-type': 'application/json;charset=UTF-8',
        Cookie: '',
        'pragma': "no-cache",
        "Cache-control": "max-age=0",
        'DNT': '1',
        'Sec-GPC': '1',
        'sec-ch-ua-platform': '',
        'sec-ch-ua-mobile': '?0',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-User': '?0',
        'TE': 'trailers',
        "Upgrade-Insecure-Requests": '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'
    };
    static BIlIBILI_LOGIN_HEADERS = {
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Sec-GPC': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers',
    };
    static BILIBILI_ARTICLE_HEADERS = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-type': 'text/html; charset=utf-8',
        Cookie: '',
        'pragma': "no-cache",
        "Cache-control": "no-cache",
        'DNT': '1',
        'Sec-GPC': '1',
        'sec-ch-ua-mobile': '?0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers',
        "Upgrade-Insecure-Requests": '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'
    };
}

export { BiliApi };
