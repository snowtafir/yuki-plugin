export class BiliApi {
  static BILIBIL_API = {
    //获取动态资源列表 wbi/无wbi parama = { host_mid: uid, timezone_offset: -480, platform: 'web', features: 'itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote', web_location: "333.999", ...getDmImg(), "x-bili-device-req-json": { "platform": "web", "device": "pc" }, "x-bili-web-req-json": { "spm_id": "333.999" }, w_rid, wts }
    biliDynamicInfoList: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space`,

    //获取关注数与粉丝数 parama = { vmid: uid }
    biliUpFollowFans: `https://api.bilibili.com/x/relation/stat`,

    //通过uid获取up详情 parama = { mid: uid, jsonp: jsonp }
    biliSpaceUserInfo: `https://api.bilibili.com/x/space/acc/info`,

    //parama = { mid: uid, token: '',platform: 'web', web_location: 1550101, w_webid, w_rid, wts }
    biliSpaceUserInfoWbi: `https://api.bilibili.com/x/space/wbi/acc/info`,

    //通过关键词${upKeyword}搜索up主 parama = { keyword: 'upKeyword', page: 1, search_type: 'bili_user', order: 'totalrank', pagesize: 5  }
    biliSearchUp: `https://api.bilibili.com/x/web-interface/search/type`,
    //通过关键词${upKeyword}搜索up主 parama = { keyword: 'upKeyword', page: 1, search_type: 'bili_user', order: 'totalrank'  }，需要wbi签名
    biliSearchUpWbi: `https://api.bilibili.com/x/web-interface/wbi/search/type`,

    biliLiveStatus: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
    biliCard: 'https://api.bilibili.com/x/web-interface/card',
    biliStat: 'https://api.bilibili.com/x/relation/stat',
    biliLiveUserInfo: 'https://api.live.bilibili.com/live_user/v1/Master/info',
    biliOpusDetail: 'https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail'
  };

  static BILIBILI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

  /**header */
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
  /**Login header */
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
  /**FullArticle header */
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
