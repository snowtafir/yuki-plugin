
export class BiliApi {
  static BILIBIL_API = {
    //获取动态资源列表 wbi/无wbi parama = { host_mid: uid, timezone_offset: -480, platform: 'web', features: 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote', web_location: "333.999", ...getDmImg(), "x-bili-device-req-json": { "platform": "web", "device": "pc" }, "x-bili-web-req-json": { "spm_id": "333.999" }, w_rid, wts }
    biliDynamicInfoList: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space`,

    //获取关注数与粉丝数 parama = { vmid: uid }
    biliUpFollowFans: `https://api.bilibili.com/x/relation/stat`,

    //通过uid获取up详情 parama = { mid: uid, jsonp: jsonp }
    biliSpaceUserInfo: `https://api.bilibili.com/x/space/acc/info`,

    //parama = { mid: uid, jsonp: jsonp }
    biliSpaceUserInfoWbi: `https://api.bilibili.com/x/space/wbi/acc/info`,

    //通过关键词${upKeyword}搜索up主 parama = { keyword: 'upKeyword', page: 1, search_type: 'bili_user', order: 'totalrank', pagesize: 5  }
    biliSearchUp: `https://api.bilibili.com/x/web-interface/search/type`,

    biliLiveStatus: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
    biliCard: "https://api.bilibili.com/x/web-interface/card",
    biliStat: "https://api.bilibili.com/x/relation/stat",
    biliLiveUserInfo: "https://api.live.bilibili.com/live_user/v1/Master/info",
    biliOpusDetail: "https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail",
  };

  /**header */
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
  }
  /**Login header */
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
  }
  /**FullArticle header */
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
  }
}
