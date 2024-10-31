import Config from '../../utils/config.js';

class BiliApi {
    biliConfigData;
    USER_AGENT;
    constructor() {
        this.biliConfigData = Config.getUserConfig('bilibili', 'config');
        this.USER_AGENT = BiliApi.BILIBILI_USER_AGENT;
        this.initialize();
    }
    static BILIBILI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
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
    get BILIBIL_API() {
        return {
            biliServerTimeStamp: 'https://api.live.bilibili.com/xlive/open-interface/v1/rtc/getTimestamp',
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
    }
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
    async BILIBILI_BROWSER_DATA(_uuid) {
        return {
            '3064': 1,
            '5062': `${Date.now()}`,
            '03bf': 'https://www.bilibili.com/',
            '39c8': '333.999.fp.risk',
            '34f1': '',
            'd402': '',
            '654a': '',
            '6e7c': '878x1066',
            '3c43': {
                '2673': 0,
                '5766': 24,
                '6527': 0,
                '7003': 1,
                '807e': 1,
                'b8ce': this.USER_AGENT,
                '641c': 0,
                '07a4': 'zh-CN',
                '1c57': 'not available',
                '0bd0': 16,
                '748e': [1920, 1200],
                'd61f': [1920, 1152],
                'fc9d': -480,
                '6aa9': 'Asia/Shanghai',
                '75b8': 1,
                '3b21': 1,
                '8a1c': 0,
                'd52f': 'not available',
                'adca': this.USER_AGENT.includes('Windows') ? 'Win32' : 'Linux',
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
                ],
                '13ab': 'f3YAAAAASUVORK5CYII=',
                'bfe9': 'kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=',
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
                ],
                '6bc5': 'Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar',
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
            'df35': `${_uuid}`,
            '07a4': 'zh-CN',
            '5f45': null,
            'db46': 0
        };
    }
    BILIBILI_FINGERPRINT_DATA(_uuid) {
        return {
            userAgent: this.USER_AGENT,
            webdriver: false,
            language: 'zh-CN',
            colorDepth: 24,
            deviceMemory: 'not available',
            pixelRatio: 2,
            hardwareConcurrency: 8,
            screenResolution: '1920x1200',
            availableScreenResolution: '1920x1152',
            timezoneOffset: -480,
            timezone: 'Asia/Shanghai',
            sessionStorage: true,
            localStorage: true,
            indexedDb: true,
            addBehavior: false,
            openDatabase: false,
            cpuClass: 'not available',
            platform: this.USER_AGENT.includes('Windows') ? 'Win32' : 'Linux',
            doNotTrack: null,
            plugins: [
                { name: 'PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Chrome PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Chromium PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'Microsoft Edge PDF Viewer', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] },
                { name: 'WebKit built-in PDF', description: 'Portable Document Format', mimeTypes: [['application/pdf', 'pdf']] }
            ],
            canvas: 'f3YAAAAASUVORK5CYII=',
            webgl: 'kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=',
            webglVendorAndRenderer: 'Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar',
            adBlock: false,
            hasLiedLanguages: false,
            hasLiedResolution: false,
            hasLiedOs: false,
            hasLiedBrowser: false,
            touchSupport: 0,
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
            fontsFlash: false,
            audio: '35.749972093850374',
            enumerateDevices: [`id=${_uuid};gid=groupId1;kind=videoinput;label=Camera1`, `id=${_uuid};gid=groupId2;kind=audioinput;label=Microphone1`]
        };
    }
}
var BiliApi$1 = new BiliApi();

export { BiliApi$1 as default };
