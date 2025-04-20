import Config from '../../utils/config.js';

class BiliApi {
    biliConfigData;
    USER_AGENT;
    constructor() {
        this.biliConfigData = Config.getUserConfig('bilibili', 'config');
        this.USER_AGENT = BiliApi.BILIBILI_USER_AGENT;
        this.initialize();
    }
    static BILIBILI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
    //初始化User-Agent
    async initialize() {
        await this.initUserAgent();
    }
    async initUserAgent() {
        const userAgentList = await this.biliConfigData.userAgentList;
        if (userAgentList && userAgentList.length > 0) {
            const randomIndex = Math.floor(Math.random() * userAgentList.length);
            this.USER_AGENT = String(userAgentList[randomIndex]);
        }
    }
    // 将静态常量赋值给实例属性
    get BILIBIL_API() {
        return {
            //获取服务器端RTC时间戳
            biliServerTimeStamp: 'https://api.live.bilibili.com/xlive/open-interface/v1/rtc/getTimestamp',
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
            // 获取视频详情无wbi  parama = { aid: avid } 或 { bvid: bvid }
            biliVideoInfo: `https://api.bilibili.com/x/web-interface/view`,
            // 获取视频详情 wbi  parama = { aid: avid } 或 { bvid: bvid }
            biliVideoInfoWbi: `https://api.bilibili.com/x/web-interface/wbi/view`,
            //短链
            biliShortVideoUrl: `https://b23.tv/`,
            biliLiveStatus: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
            biliCard: 'https://api.bilibili.com/x/web-interface/card',
            biliStat: 'https://api.bilibili.com/x/relation/stat',
            biliLiveUserInfo: 'https://api.live.bilibili.com/live_user/v1/Master/info',
            biliOpusDetail: 'https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail'
        };
    }
    /**header */
    get BILIBILI_HEADERS() {
        return {
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
            'User-Agent': this.USER_AGENT
        };
    }
    /**Login header */
    get BIlIBILI_LOGIN_HEADERS() {
        return {
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
    }
    /**FullArticle header */
    get BILIBILI_ARTICLE_HEADERS() {
        return {
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
            'User-Agent': this.USER_AGENT
        };
    }
    get BILIBILI_DYNAMIC_SPACE_HEADERS() {
        return {
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
            'User-Agent': this.USER_AGENT
        };
    }
    /**返回GatWay payload */
    async BILIBILI_BROWSER_DATA(_uuid) {
        return {
            '3064': 1, // ptype, mobile => 2, others => 1
            '5062': `${Date.now()}`, // timestamp
            '03bf': 'https://www.bilibili.com/', // url accessed
            '39c8': '333.999.fp.risk',
            '34f1': '', // target_url, default empty now
            'd402': '', // screenx, default empty
            '654a': '', // screeny, default empty
            '6e7c': '878x1066', // browser_resolution, window.innerWidth || document.body && document.body.clientWidth + "x" + window.innerHeight || document.body && document.body.clientHeight
            '3c43': {
                // 3c43 => msg
                '2673': 0, // hasLiedResolution, window.screen.width < window.screen.availWidth || window.screen.height < window.screen.availHeight
                '5766': 24, // colorDepth, window.screen.colorDepth
                '6527': 0, // addBehavior, !!window.HTMLElement.prototype.addBehavior, html5 api
                '7003': 1, // indexedDb, !!window.indexedDB, html5 api
                '807e': 1, // cookieEnabled, navigator.cookieEnabled
                'b8ce': this.USER_AGENT, // ua "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
                '641c': 0, // webdriver, navigator.webdriver, like Selenium
                '07a4': 'zh-CN', // language
                '1c57': 'not available', // deviceMemory in GB, navigator.deviceMemory
                '0bd0': 16, // hardwareConcurrency, navigator.hardwareConcurrency
                '748e': [1920, 1200], // window.screen.width window.screen.height
                'd61f': [1920, 1152], // window.screen.availWidth window.screen.availHeight
                'fc9d': -480, // timezoneOffset, (new Date).getTimezoneOffset()
                '6aa9': 'Asia/Shanghai', //Intl.DateTimeFormat().resolvedOptions().timeZone, // timezone, (new window.Intl.DateTimeFormat).resolvedOptions().timeZone
                '75b8': 1, // sessionStorage, window.sessionStorage, html5 api
                '3b21': 1, // localStorage, window.localStorage, html5 api
                '8a1c': 0, // openDatabase, window.openDatabase, html5 api
                'd52f': 'not available', // cpuClass, navigator.cpuClass
                'adca': this.USER_AGENT.includes('Windows') ? 'Win32' : 'Linux', // platform, navigator.platform
                '80c9': [
                    [
                        'PDF Viewer',
                        'Portable Document Format',
                        [
                            ['application/pdf', 'pdf'],
                            ['text/pdf', 'pdf']
                        ]
                    ],
                    [
                        'Chrome PDF Viewer',
                        'Portable Document Format',
                        [
                            ['application/pdf', 'pdf'],
                            ['text/pdf', 'pdf']
                        ]
                    ],
                    [
                        'Chromium PDF Viewer',
                        'Portable Document Format',
                        [
                            ['application/pdf', 'pdf'],
                            ['text/pdf', 'pdf']
                        ]
                    ],
                    [
                        'Microsoft Edge PDF Viewer',
                        'Portable Document Format',
                        [
                            ['application/pdf', 'pdf'],
                            ['text/pdf', 'pdf']
                        ]
                    ],
                    [
                        'WebKit built-in PDF',
                        'Portable Document Format',
                        [
                            ['application/pdf', 'pdf'],
                            ['text/pdf', 'pdf']
                        ]
                    ]
                ], // plugins
                '13ab': 'f3YAAAAASUVORK5CYII=', // canvas fingerprint
                'bfe9': 'kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=', // webgl_str
                'a3c1': [
                    'extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_sRGB;EXT_texture_compression_bptc;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_provoking_vertex',
                    'webgl aliased line width range:[1, 1]',
                    'webgl aliased point size range:[1, 1024]',
                    'webgl alpha bits:8',
                    'webgl antialiasing:yes',
                    'webgl blue bits:8',
                    'webgl depth bits:24',
                    'webgl green bits:8',
                    'webgl max anisotropy:16',
                    'webgl max combined texture image units:32',
                    'webgl max cube map texture size:16384',
                    'webgl max fragment uniform vectors:1024',
                    'webgl max render buffer size:16384',
                    'webgl max texture image units:16',
                    'webgl max texture size:16384',
                    'webgl max varying vectors:30',
                    'webgl max vertex attribs:16',
                    'webgl max vertex texture image units:16',
                    'webgl max vertex uniform vectors:4096',
                    'webgl max viewport dims:[32767, 32767]',
                    'webgl red bits:8',
                    'webgl renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar',
                    'webgl shading language version:WebGL GLSL ES 1.0',
                    'webgl stencil bits:0',
                    'webgl vendor:Mozilla',
                    'webgl version:WebGL 1.0',
                    'webgl unmasked vendor:Google Inc. (Intel)',
                    'webgl unmasked renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar',
                    'webgl vertex shader high float precision:23',
                    'webgl vertex shader high float precision rangeMin:127',
                    'webgl vertex shader high float precision rangeMax:127',
                    'webgl vertex shader medium float precision:23',
                    'webgl vertex shader medium float precision rangeMin:127',
                    'webgl vertex shader medium float precision rangeMax:127',
                    'webgl vertex shader low float precision:23',
                    'webgl vertex shader low float precision rangeMin:127',
                    'webgl vertex shader low float precision rangeMax:127',
                    'webgl fragment shader high float precision:23',
                    'webgl fragment shader high float precision rangeMin:127',
                    'webgl fragment shader high float precision rangeMax:127',
                    'webgl fragment shader medium float precision:23',
                    'webgl fragment shader medium float precision rangeMin:127',
                    'webgl fragment shader medium float precision rangeMax:127',
                    'webgl fragment shader low float precision:23',
                    'webgl fragment shader low float precision rangeMin:127',
                    'webgl fragment shader low float precision rangeMax:127',
                    'webgl vertex shader high int precision:0',
                    'webgl vertex shader high int precision rangeMin:31',
                    'webgl vertex shader high int precision rangeMax:30',
                    'webgl vertex shader medium int precision:0',
                    'webgl vertex shader medium int precision rangeMin:31',
                    'webgl vertex shader medium int precision rangeMax:30',
                    'webgl vertex shader low int precision:0',
                    'webgl vertex shader low int precision rangeMin:31',
                    'webgl vertex shader low int precision rangeMax:30',
                    'webgl fragment shader high int precision:0',
                    'webgl fragment shader high int precision rangeMin:31',
                    'webgl fragment shader high int precision rangeMax:30',
                    'webgl fragment shader medium int precision:0',
                    'webgl fragment shader medium int precision rangeMin:31',
                    'webgl fragment shader medium int precision rangeMax:30',
                    'webgl fragment shader low int precision:0',
                    'webgl fragment shader low int precision rangeMin:31',
                    'webgl fragment shader low int precision rangeMax:30'
                ], // webgl_params, cab be set to [] if webgl is not supported
                '6bc5': 'Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar', // webglVendorAndRenderer
                'ed31': 0,
                '72bd': 0,
                '097b': 0,
                '52cd': [0, 0, 0],
                'a658': [
                    'Arial',
                    'Arial Black',
                    'Calibri',
                    'Cambria',
                    'Cambria Math',
                    'Comic Sans MS',
                    'Consolas',
                    'Courier',
                    'Courier New',
                    'Georgia',
                    'Helvetica',
                    'Impact',
                    'Lucida Console',
                    'Lucida Sans Unicode',
                    'Microsoft Sans Serif',
                    'MS Gothic',
                    'MS PGothic',
                    'MS Sans Serif',
                    'MS Serif',
                    'Palatino Linotype',
                    'Segoe Print',
                    'Segoe Script',
                    'Segoe UI',
                    'Segoe UI Light',
                    'Segoe UI Symbol',
                    'Tahoma',
                    'Times',
                    'Times New Roman',
                    'Trebuchet MS',
                    'Verdana',
                    'Wingdings'
                ],
                'd02f': '35.749972093850374'
            },
            '54ef': {
                'in_new_ab ': true,
                'ab_version ': {
                    'waterfall_article ': 'SHOW '
                },
                'ab_split_num ': {
                    'waterfall_article ': 0
                }
            },
            '8b94': '',
            'df35': `${_uuid}`, // _uuid, set from cookie, generated by client side(algorithm remains unknown)
            '07a4': 'zh-CN',
            '5f45': null,
            'db46': 0
        };
    }
    /**返回Bilibili Fingerprint data */
    BILIBILI_FINGERPRINT_DATA(_uuid) {
        return {
            userAgent: this.USER_AGENT, // 用户代理
            webdriver: false, // 是否是 WebDriver（例如 Selenium）
            language: 'zh-CN', // 浏览器语言
            colorDepth: 24, // 屏幕颜色深度
            deviceMemory: 'not available', // 设备内存（GB）
            pixelRatio: 2, // 设备像素比
            hardwareConcurrency: 8, // 处理器核心数量
            screenResolution: '1920x1200', // 屏幕分辨率
            availableScreenResolution: '1920x1152', // 可用屏幕分辨率
            timezoneOffset: -480, // 时区偏移，单位为分钟
            timezone: 'Asia/Shanghai', // 时区
            sessionStorage: true, // 是否支持 sessionStorage
            localStorage: true, // 是否支持 localStorage
            indexedDb: true, // 是否支持 IndexedDB
            addBehavior: false, // 是否支持 addBehavior
            openDatabase: false, // 是否支持 openDatabase
            cpuClass: 'not available', // CPU 类型amd 或 intel 或 not available
            platform: this.USER_AGENT.includes('Windows') ? 'Win32' : 'Linux', // 操作系统平台，例如 Windows，Linux，Mac
            doNotTrack: null, // DNT 设置，通常是 `navigator.doNotTrack`
            plugins: [
                { name: 'PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Chrome PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Chromium PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Microsoft Edge PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'WebKit built-in PDF', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] }
            ],
            canvas: 'f3YAAAAASUVORK5CYII=', // Canvas 指纹
            webgl: 'kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=', // WebGL 参数
            webglVendorAndRenderer: 'Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar', // WebGL 的厂商和渲染器信息
            adBlock: false, // 是否检测到广告拦截器
            hasLiedLanguages: false, // 是否谎称语言
            hasLiedResolution: false, // 是否谎称分辨率
            hasLiedOs: false, // 是否谎称操作系统
            hasLiedBrowser: false, // 是否谎称浏览器
            touchSupport: 0, // 支持的触摸点数
            fonts: [
                'Arial',
                'Arial Black',
                'Calibri',
                'Cambria',
                'Cambria Math',
                'Comic Sans MS',
                'Consolas',
                'Courier',
                'Courier New',
                'Georgia',
                'Helvetica',
                'Impact',
                'Lucida Console',
                'Lucida Sans Unicode',
                'Microsoft Sans Serif',
                'MS Gothic',
                'MS PGothic',
                'MS Sans Serif',
                'MS Serif',
                'Palatino Linotype',
                'Segoe Print',
                'Segoe Script',
                'Segoe UI',
                'Segoe UI Light',
                'Segoe UI Symbol',
                'Tahoma',
                'Times',
                'Times New Roman',
                'Trebuchet MS',
                'Verdana',
                'Wingdings'
            ],
            fontsFlash: false, // Flash 插件是否安装
            audio: '35.749972093850374', // 音频指纹
            enumerateDevices: [`id=${_uuid};gid=groupId1;kind=videoinput;label=Camera1`, `id=${_uuid};gid=groupId2;kind=audioinput;label=Microphone1`]
            // 枚举设备指纹，Unreliable on Windows, see https://github.com/fingerprintjs/fingerprintjs/issues/375
        };
    }
}
var BiliApi$1 = new BiliApi();

export { BiliApi$1 as default };
