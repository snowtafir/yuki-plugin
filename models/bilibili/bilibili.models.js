import axios from 'axios';
import fs__default from 'fs';
import lodash from 'lodash';
import fetch from 'node-fetch';
import { promisify } from 'node:util';
import path from 'path';
import QRCode from 'qrcode';
import YAML from 'yaml';
import Image from '../../utils/image.js';
import { _paths } from '../../utils/paths.js';
import { BiliApi } from './bilibili.api.js';

async function applyLoginQRCode(e) {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header';
    const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'user-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { 'Host': 'passport.bilibili.com', }),
        redirect: "follow",
    });
    const res = await response.json();
    if (res?.code === 0) {
        const qrcodeKey = res.data.qrcode_key;
        const qrcodeUrl = res.data.url;
        let loginUrlQrcodeData = await QRCode.toDataURL(`${qrcodeUrl}`);
        const LoginPropsData = {
            data: { url: loginUrlQrcodeData }
        };
        const ScreenshotOptionsData = {
            saveHtmlfile: false,
            modelName: "bili-login"
        };
        const qrCodeImage = await Image.renderPage("bili-login", "LoginQrcodePage", LoginPropsData, ScreenshotOptionsData);
        let qrcodeImg;
        if (qrCodeImage !== false) {
            const { img } = qrCodeImage;
            qrcodeImg = img;
        }
        let msg = [];
        msg.push(segment.image(qrcodeImg[0]));
        e.reply('请在3分钟内扫码以完成B站登陆绑定');
        e.reply(msg);
        (logger ?? Bot.logger)?.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 使用在线或本地二维码生成工具生成二维码并扫码`);
        (logger ?? Bot.logger)?.info(`优纪插件: 哔哩登陆二维码URL: ${qrcodeUrl}`);
        return qrcodeKey;
    }
    else {
        e.reply(`获取B站登录二维码失败: ${res.data.message}`);
        throw new Error(`获取B站登录二维码失败: ${res.data.message}`);
    }
}
async function pollLoginQRCode(e, qrcodeKey) {
    const url = `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcodeKey}&source=main-fe-header`;
    const response = await fetch(url, {
        method: "GET",
        headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { 'Host': 'passport.bilibili.com', }),
        redirect: "follow",
    });
    const data = await response.json();
    if (data.code === 0) {
        if (data.data.code === 0) {
            const LoginCookie = response.headers.get('set-cookie');
            e.reply(`~B站登陆成功~`);
            return LoginCookie;
        }
        else if (data.data.code === 86101) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            (logger ?? Bot.logger)?.mark(`优纪插件：扫码B站登录：未扫码，轮询中...`);
            return pollLoginQRCode(e, qrcodeKey);
        }
        else if (data.data.code === 86090) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return pollLoginQRCode(e, qrcodeKey);
        }
        else if (data.data.code === 86038) {
            e.reply('B站登陆二维码已失效');
            return null;
        }
        else {
            e.reply('处理扫码结果出错');
            throw new Error(`处理扫码结果出错: ${data?.data?.message}`);
        }
    }
    else {
        e.reply('处理扫码结果出错');
        throw new Error(`处理扫码结果出错: ${data?.message}`);
    }
}
async function checkBiliLogin(e) {
    const LoginCookie = await readLoginCookie();
    const res = await fetch("https://api.bilibili.com/x/web-interface/nav", {
        method: "GET",
        headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { "Cookie": `${LoginCookie}`, }),
        redirect: "follow",
    });
    const resData = await res.json();
    Bot.logger?.debug(`B站验证登录状态:${JSON.stringify(resData)}`);
    if (resData.code === 0) {
        let uname = resData.data?.uname;
        let mid = resData.data?.mid;
        let money = resData.data?.money;
        let level_info = resData.data?.level_info;
        let current_level = level_info?.current_level;
        let current_exp = level_info?.current_exp;
        let next_exp = level_info?.next_exp;
        e.reply(`~B站账号已登陆~\n昵称：${uname}\nuid：${mid}\n硬币：${money}\n经验等级：${current_level}\n当前经验值exp：${current_exp}\n下一等级所需exp：${next_exp}`);
    }
    else {
        return;
    }
}
async function exitBiliLogin(e) {
    const url = 'https://passport.bilibili.com/login/exit/v2';
    const exitCk = await readLoginCookie();
    const [SESSDATA, biliCSRF, DedeUserID] = await Promise.all([
        readSavedCookieItems(exitCk, ['SESSDATA'], false),
        readSavedCookieItems(exitCk, ['bili_jct'], false),
        readSavedCookieItems(exitCk, ['DedeUserID'], false)
    ]);
    if (lodash.trim(SESSDATA).length === 0 || lodash.trim(biliCSRF).length === 0 || lodash.trim(DedeUserID).length === 0) {
        e.reply("当前无可用的B站登录CK可退出登录");
        return;
    }
    const postData = new URLSearchParams({ "biliCSRF": biliCSRF });
    try {
        const resp = await axios.post(url, postData.toString(), {
            headers: {
                "Host": 'passport.bilibili.com',
                "Cookie": `DedeUserID=${DedeUserID}; bili_jct=${biliCSRF}; SESSDATA=${SESSDATA}`,
                "Content-Type": 'application/x-www-form-urlencoded',
            },
        });
        const contentType = resp.headers["Content-Type"];
        if (typeof contentType === 'string' && contentType.includes('text/html')) {
            e.reply("当前缓存的B站登录CK早已失效！");
            return;
        }
        const { code, status, data } = resp.data;
        logger.mark('Response Data:', data);
        if (status) {
            switch (code) {
                case 0:
                    e.reply("当前缓存的B站登录CK已在服务器注销~");
                    await redis.set("Yz:yuki:bili:loginCookie", "", { EX: 3600 * 24 * 180 });
                    e.reply(`登陆的B站ck并已删除~`);
                    break;
                case 2202:
                    e.reply("csrf 请求非法，退出登录请求出错");
                    break;
                default:
                    e.reply("当前缓存的B站登录CK早已失效！");
            }
        }
        else {
            e.reply("服务器响应异常，退出登录请求出错");
        }
    }
    catch (error) {
        console.error('Error during Bili login exit:', error);
        e.reply("退出登录请求出错，请稍后再试");
    }
}
async function saveLoginCookie(e, biliLoginCk) {
    if (biliLoginCk && biliLoginCk.length > 0) {
        const LoginCkKey = "Yz:yuki:bili:loginCookie";
        redis.set(LoginCkKey, biliLoginCk, { EX: 3600 * 24 * 360 });
    }
    else {
        e.reply("扫码超时");
    }
}
async function readLoginCookie() {
    const CK_KEY = "Yz:yuki:bili:loginCookie";
    const tempCk = await redis.get(CK_KEY);
    return tempCk ? tempCk : '';
}
async function readLocalBiliCk() {
    const dir = path.join(_paths.root, 'data/yuki-plugin/');
    if (!fs__default.existsSync(dir)) {
        fs__default.mkdirSync(dir, { recursive: true });
    }
    const files = fs__default.readdirSync(dir).filter((file) => file.endsWith('.yaml'));
    const readFile = promisify(fs__default.readFile);
    const promises = files.map((file) => readFile(path.join(dir, file), 'utf8'));
    const contents = await Promise.all(promises);
    const Bck = contents.map((content) => YAML.parse(content));
    return Bck[0];
}
async function saveLocalBiliCk(data) {
    const dirPath = path.join(_paths.root, 'data/yuki-plugin/');
    const filePath = path.join(dirPath, 'biliCookie.yaml');
    const cleanedData = String(data).replace(/\s/g, '').trim();
    if (lodash.isEmpty(cleanedData)) {
        fs__default.existsSync(filePath) && fs__default.unlinkSync(filePath);
    }
    else {
        if (!fs__default.existsSync(dirPath)) {
            fs__default.mkdirSync(dirPath, { recursive: true });
        }
        const yamlContent = YAML.stringify(cleanedData);
        fs__default.writeFileSync(filePath, yamlContent, 'utf8');
    }
}
async function readTempCk() {
    const CK_KEY = "Yz:yuki:bili:tempCookie";
    const tempCk = await redis.get(CK_KEY);
    return tempCk ?? '';
}
async function saveTempCk(newTempCk) {
    const CK_KEY = "Yz:yuki:bili:tempCookie";
    await redis.set(CK_KEY, newTempCk, { EX: 3600 * 24 * 180 });
}
async function readSyncCookie() {
    const localCk = await readLocalBiliCk();
    const tempCk = await readTempCk();
    const loginCk = await readLoginCookie();
    const validCk = (ck) => ck?.trim().length > 10;
    if (validCk(localCk)) {
        return { cookie: localCk, mark: "localCk" };
    }
    else if (validCk(loginCk)) {
        return { cookie: loginCk + ";", mark: "loginCk" };
    }
    else if (validCk(tempCk)) {
        return { cookie: tempCk, mark: "tempCk" };
    }
    else {
        return { cookie: '', mark: "ckIsEmpty" };
    }
}
async function readSavedCookieItems(mark, items, isInverted = false) {
    let ckString;
    switch (mark) {
        case 'localCK':
            ckString = await readLocalBiliCk();
            break;
        case 'tempCK':
            ckString = await readTempCk();
            break;
        case 'loginCK':
            ckString = await readLoginCookie();
            break;
        default:
            ckString = mark;
    }
    const Bck = lodash.trim(ckString);
    if (!Bck) {
        return '';
    }
    if (items[0] === 'all') {
        return Bck;
    }
    const cookiePairs = String(Bck)
        .trim()
        .match(/(\w+)=([^;|,]+)/g)
        ?.map(match => match.split('='))
        .filter(([key, value]) => (isInverted ? !items.includes(key) : items.includes(key)) && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join(';') || '';
    return cookiePairs;
}
async function readSavedCookieOtherItems(mark, items) {
    return await readSavedCookieItems(mark, items, true);
}
async function genUUID() {
    const generatePart = (length) => Array.from({ length }, () => Math.floor(16 * Math.random()))
        .map(num => num.toString(16).toUpperCase())
        .join('');
    const padLeft = (str, length) => str.padStart(length, '0');
    const e = generatePart(8);
    const t = generatePart(4);
    const r = generatePart(4);
    const n = generatePart(4);
    const o = generatePart(12);
    const i = Date.now();
    const uuid = `_uuid=${e}-${t}-${r}-${n}-${o}${padLeft((i % 1e5).toString(), 5)}infoc;`;
    return uuid;
}
async function gen_b_lsid() {
    function get_random_str(length) {
        return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
    }
    const timestamp = Date.now();
    const randomPart = get_random_str(8);
    const timestampHex = timestamp.toString(16).toUpperCase();
    return `b_lsid=${randomPart}_${timestampHex};`;
}
async function getBuvid3_4(uuid) {
    const url = 'https://api.bilibili.com/x/frontend/finger/spi/';
    const headers = lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
        'Cookie': `_uuid=${uuid}`,
        'Host': 'api.bilibili.com',
        'Origin': 'https://www.bilibili.com',
        'Referer': 'https://www.bilibili.com/',
    });
    const response = await axios.get(url, { headers });
    const { code, data } = response.data;
    if (code === 0) {
        const { b_3: buvid3, b_4: buvid4 } = data;
        return `buvid3=${buvid3};buvid4=${buvid4};`;
    }
    else {
        return '';
    }
}
async function getNewTempCk() {
    const uuid = await genUUID();
    const buvid3_buvid4 = await getBuvid3_4(uuid);
    const b_lsid = await gen_b_lsid();
    let newTempCk = `${uuid}${buvid3_buvid4}${b_lsid}`;
    await saveTempCk(newTempCk);
    const result = await postGateway(newTempCk);
    const { code, data } = await result.data;
    if (code !== 0) {
        logger?.mark(`优纪插件：tempCK，Gateway校验失败：${JSON.stringify(data)}`);
    }
    else if (code === 0) {
        logger?.mark(`优纪插件：tempCK，Gateway校验成功：${JSON.stringify(data)}`);
    }
}
async function getPayload(cookie) {
    const payloadOriginData = {
        "3064": 1,
        "5062": `${Date.now()}`,
        "03bf": "https://www.bilibili.com/",
        "39c8": "333.999.fp.risk",
        "34f1": "",
        "d402": "",
        "654a": "",
        "6e7c": "878x1066",
        "3c43": {
            "2673": 0,
            "5766": 24,
            "6527": 0,
            "7003": 1,
            "807e": 1,
            "b8ce": BiliApi.BILIBILI_HEADERS['User-Agent'],
            "641c": 0,
            "07a4": "zh-CN",
            "1c57": "not available",
            "0bd0": 16,
            "748e": [1920, 1200],
            "d61f": [1920, 1152],
            "fc9d": -480,
            "6aa9": "Asia/Shanghai",
            "75b8": 1,
            "3b21": 1,
            "8a1c": 0,
            "d52f": "not available",
            "adca": BiliApi.BILIBILI_HEADERS['User-Agent'].includes('Windows') ? 'Win32' : 'Linux',
            "80c9": [
                ["PDF Viewer", "Portable Document Format", [
                        ["application/pdf", "pdf"],
                        ["text/pdf", "pdf"]
                    ]],
                ["Chrome PDF Viewer", "Portable Document Format", [
                        ["application/pdf", "pdf"],
                        ["text/pdf", "pdf"]
                    ]],
                ["Chromium PDF Viewer", "Portable Document Format", [
                        ["application/pdf", "pdf"],
                        ["text/pdf", "pdf"]
                    ]],
                ["Microsoft Edge PDF Viewer", "Portable Document Format", [
                        ["application/pdf", "pdf"],
                        ["text/pdf", "pdf"]
                    ]],
                ["WebKit built-in PDF", "Portable Document Format", [
                        ["application/pdf", "pdf"],
                        ["text/pdf", "pdf"]
                    ]]
            ],
            "13ab": "f3YAAAAASUVORK5CYII=",
            "bfe9": "kABYpRAGAVYzWJooB9Bf4P+UortSvxRY0AAAAASUVORK5CYII=",
            "a3c1": [
                "extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_sRGB;EXT_texture_compression_bptc;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_provoking_vertex",
                "webgl aliased line width range:[1, 1]",
                "webgl aliased point size range:[1, 1024]",
                "webgl alpha bits:8", "webgl antialiasing:yes",
                "webgl blue bits:8",
                "webgl depth bits:24",
                "webgl green bits:8",
                "webgl max anisotropy:16",
                "webgl max combined texture image units:32",
                "webgl max cube map texture size:16384",
                "webgl max fragment uniform vectors:1024",
                "webgl max render buffer size:16384",
                "webgl max texture image units:16",
                "webgl max texture size:16384",
                "webgl max varying vectors:30",
                "webgl max vertex attribs:16",
                "webgl max vertex texture image units:16",
                "webgl max vertex uniform vectors:4096",
                "webgl max viewport dims:[32767, 32767]",
                "webgl red bits:8",
                "webgl renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
                "webgl shading language version:WebGL GLSL ES 1.0",
                "webgl stencil bits:0",
                "webgl vendor:Mozilla",
                "webgl version:WebGL 1.0",
                "webgl unmasked vendor:Google Inc. (Intel)",
                "webgl unmasked renderer:ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
                "webgl vertex shader high float precision:23",
                "webgl vertex shader high float precision rangeMin:127",
                "webgl vertex shader high float precision rangeMax:127",
                "webgl vertex shader medium float precision:23",
                "webgl vertex shader medium float precision rangeMin:127",
                "webgl vertex shader medium float precision rangeMax:127",
                "webgl vertex shader low float precision:23",
                "webgl vertex shader low float precision rangeMin:127",
                "webgl vertex shader low float precision rangeMax:127",
                "webgl fragment shader high float precision:23",
                "webgl fragment shader high float precision rangeMin:127",
                "webgl fragment shader high float precision rangeMax:127",
                "webgl fragment shader medium float precision:23",
                "webgl fragment shader medium float precision rangeMin:127",
                "webgl fragment shader medium float precision rangeMax:127",
                "webgl fragment shader low float precision:23",
                "webgl fragment shader low float precision rangeMin:127",
                "webgl fragment shader low float precision rangeMax:127",
                "webgl vertex shader high int precision:0",
                "webgl vertex shader high int precision rangeMin:31",
                "webgl vertex shader high int precision rangeMax:30",
                "webgl vertex shader medium int precision:0",
                "webgl vertex shader medium int precision rangeMin:31",
                "webgl vertex shader medium int precision rangeMax:30",
                "webgl vertex shader low int precision:0",
                "webgl vertex shader low int precision rangeMin:31",
                "webgl vertex shader low int precision rangeMax:30",
                "webgl fragment shader high int precision:0",
                "webgl fragment shader high int precision rangeMin:31",
                "webgl fragment shader high int precision rangeMax:30",
                "webgl fragment shader medium int precision:0",
                "webgl fragment shader medium int precision rangeMin:31",
                "webgl fragment shader medium int precision rangeMax:30",
                "webgl fragment shader low int precision:0",
                "webgl fragment shader low int precision rangeMin:31",
                "webgl fragment shader low int precision rangeMax:30"
            ],
            "6bc5": "Google Inc. (Intel)~ANGLE (Intel, Intel(R) HD Graphics Direct3D11 vs_5_0 ps_5_0), or similar",
            "ed31": 0,
            "72bd": 0,
            "097b": 0,
            "52cd": [0, 0, 0],
            "a658": ["Arial", "Arial Black", "Calibri", "Cambria", "Cambria Math", "Comic Sans MS", "Consolas", "Courier", "Courier New", "Georgia", "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode", "Microsoft Sans Serif", "MS Gothic", "MS PGothic", "MS Sans Serif", "MS Serif", "Palatino Linotype", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Light", "Segoe UI Symbol", "Tahoma", "Times", "Times New Roman", "Trebuchet MS", "Verdana", "Wingdings"],
            "d02f": "35.749972093850374"
        },
        "54ef": {
            "in_new_ab ": true,
            "ab_version ": {
                "waterfall_article ": "SHOW "
            },
            "ab_split_num ": {
                "waterfall_article ": 0
            }
        },
        "8b94": "",
        "df35": `${await readSavedCookieItems(cookie, ['_uuid'], false)}`,
        "07a4": "zh-CN",
        "5f45": null,
        "db46": 0
    };
    return JSON.stringify(payloadOriginData);
}
async function postGateway(cookie) {
    const payload = getPayload(cookie);
    const requestUrl = 'https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi';
    const headers = lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
        'Cookie': cookie,
        'Content-type': 'Application/json',
        'Charset': 'UTF-8',
    }, {
        'Host': 'api.bilibili.com',
        'Origin': 'https://www.bilibili.com',
        'Referer': 'https://www.bilibili.com/',
    });
    try {
        const res = await axios.post(requestUrl, { payload }, { headers });
        return res;
    }
    catch (error) {
        logger.error('Error making POST request:', error);
        throw error;
    }
}

export { applyLoginQRCode, checkBiliLogin, exitBiliLogin, genUUID, gen_b_lsid, getNewTempCk, pollLoginQRCode, postGateway, readSavedCookieItems, readSavedCookieOtherItems, readSyncCookie, readTempCk, saveLocalBiliCk, saveLoginCookie, saveTempCk };
