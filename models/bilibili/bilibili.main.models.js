import axios from 'axios';
import fs__default from 'fs';
import lodash from 'lodash';
import fetch from 'node-fetch';
import { promisify } from 'node:util';
import path from 'path';
import QRCode from 'qrcode';
import YAML from 'yaml';
import { renderPage } from '../../utils/image.js';
import { _paths } from '../../utils/paths.js';
import BiliApi from './bilibili.main.api.js';
import { gen_buvid_fp } from './bilibili.risk.buid.fp.js';
import { getBiliTicket } from './bilibili.risk.ticket.js';

/**
 * *******************************************************************
 * Login 相关
 * *******************************************************************
 */
/**申请登陆二维码(web端) */
async function applyLoginQRCode(e) {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header';
    const response = await fetch(url, {
        method: 'GET',
        headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'user-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { Host: 'passport.bilibili.com' }),
        redirect: 'follow'
    });
    if (!response.ok) {
        throw new Error(`获取B站登录二维码URL网络请求失败，状态码: ${response.status}`);
    }
    const res = (await response.json());
    if (res?.code === 0) {
        const qrcodeKey = res?.data?.qrcode_key;
        const qrcodeUrl = res?.data?.url;
        let loginUrlQrcodeData = await QRCode.toDataURL(`${qrcodeUrl}`);
        const LoginPropsData = {
            data: { url: loginUrlQrcodeData }
        };
        const ScreenshotOptionsData = {
            saveHtmlfile: false,
            modelName: 'bili-login'
        };
        const qrCodeImage = await renderPage('bili-login', 'LoginQrcodePage', LoginPropsData, ScreenshotOptionsData);
        let qrCodeBufferArray = [];
        if (qrCodeImage !== false) {
            const { img } = qrCodeImage;
            qrCodeBufferArray = img;
        }
        let msg = [];
        if (qrCodeBufferArray.length === 0) {
            msg.push('渲染二维码图片失败，请查看终端输出的实时日志，\n复制哔哩登陆二维码URL，使用在线或本地二维码生成工具生成二维码并扫码。');
        }
        else {
            msg.push(segment.image(qrCodeBufferArray[0]));
        }
        e.reply('请在3分钟内扫码以完成B站登陆绑定');
        e.reply(msg);
        logger.info(`优纪插件: 如果发送二维码图片消息失败可复制如下URL, 使用在线或本地二维码生成工具生成二维码并扫码`);
        logger.info(`优纪插件: 哔哩登陆二维码URL: ${qrcodeUrl}`);
        return qrcodeKey;
    }
    else {
        e.reply(`获取B站登录二维码失败: ${JSON.stringify(res.data)}`);
        throw new Error(`获取B站登录二维码失败: ${JSON.stringify(res.data)}`);
    }
}
/**处理扫码结果 */
async function pollLoginQRCode(e, qrcodeKey) {
    const url = `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcodeKey}&source=main-fe-header`;
    const response = await fetch(url, {
        method: 'GET',
        headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { Host: 'passport.bilibili.com' }),
        redirect: 'follow'
    });
    if (!response.ok) {
        throw new Error(`处理B站登录token网络请求失败，状态码: ${response.status}`);
    }
    const data = (await response.json());
    if (data.code === 0) {
        if (data?.data?.code === 0) {
            // 登录成功，获取 cookie
            const LoginCookie = response.headers.get('set-cookie');
            let loginCk = '';
            try {
                const nomalCk = await getNewTempCk();
                loginCk = `${nomalCk}${LoginCookie}`;
            }
            catch (error) {
                loginCk = LoginCookie;
                logger.debug(`优纪插件: 获取B站登录ck缺失部分: ${error}`);
            }
            e.reply(`~B站登陆成功~`);
            return loginCk;
        }
        else if (data?.data?.code === 86101) {
            // 未扫码
            // 继续轮询
            await new Promise(resolve => setTimeout(resolve, 2000));
            (logger ?? Bot.logger)?.mark(`优纪插件：扫码B站登录：未扫码，轮询中...`);
            return pollLoginQRCode(e, qrcodeKey);
        }
        else if (data?.data?.code === 86090) {
            // 已扫码未确认
            // 继续轮询
            await new Promise(resolve => setTimeout(resolve, 2000));
            return pollLoginQRCode(e, qrcodeKey);
        }
        else if (data?.data?.code === 86038) {
            // 二维码已失效
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
/**查看app扫码登陆获取的ck的有效状态*/
async function checkBiliLogin(e) {
    const LoginCookie = await readLoginCookie();
    if (String(LoginCookie).trim().length < 10) {
        e.reply('啊咧？B站登录CK呢？哦，没 #扫码B站登录# 或失效了啊，那没事了。');
        return;
    }
    else {
        const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
            method: 'GET',
            headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { Cookie: `${LoginCookie}` }),
            redirect: 'follow'
        });
        const resData = await res.json();
        Bot?.logger?.debug(`B站验证登录状态:${JSON.stringify(resData)}`);
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
            // 处理其他情况
            e.reply('意外情况，未能成功获取登录ck的有效状态');
            return;
        }
    }
}
/**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
async function exitBiliLogin(e) {
    const url = 'https://passport.bilibili.com/login/exit/v2';
    const exitCk = await readLoginCookie();
    const [SESSDATA, biliCSRF, DedeUserID] = await Promise.all([
        readSavedCookieItems(exitCk, ['SESSDATA'], false),
        readSavedCookieItems(exitCk, ['bili_jct'], false),
        readSavedCookieItems(exitCk, ['DedeUserID'], false)
    ]);
    if (lodash.trim(SESSDATA).length === 0 || lodash.trim(biliCSRF).length === 0 || lodash.trim(DedeUserID).length === 0) {
        e.reply('当前无可用的B站登录CK可退出登录');
        return;
    }
    const postData = String(biliCSRF)
        .trim()
        .replace(/^bili_jct=/g, '')
        .replace(/;*$/g, '');
    try {
        const resp = await axios.post(url, { biliCSRF: postData }, {
            headers: {
                'Host': 'passport.bilibili.com',
                'User-Agent': BiliApi.BILIBILI_HEADERS['User-Agent'],
                'Cookie': `${DedeUserID};${biliCSRF};${SESSDATA}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const contentType = resp.headers['Content-Type'];
        if (typeof contentType === 'string' && contentType.includes('text/html')) {
            e.reply('当前缓存的B站登录CK早已失效！');
            return;
        }
        const res = resp.data;
        logger?.debug(`exitBiliLogin:  ${JSON.stringify(res)}`);
        const { code } = res;
        switch (code) {
            case 0:
                e.reply('当前缓存的B站登录CK已在B站服务器退出登录~');
                break;
            case 2202:
                e.reply('csrf 请求非法，退出登录请求出错');
                break;
            case -101:
                e.reply('当前缓存的扫码B站ck未登录！');
                break;
            default:
                e.reply('未知情况！无妨');
                return;
        }
    }
    catch (error) {
        e.reply('退出登录请求出错');
        console.error('Error during Bili login exit:', error);
    }
}
/**
 * *******************************************************************
 * cookie相关
 * *******************************************************************
 */
/**保存扫码登录的loginCK*/
async function saveLoginCookie(e, biliLoginCk) {
    if (biliLoginCk && biliLoginCk.length > 0) {
        const LoginCkKey = 'Yz:yuki:bili:loginCookie';
        redis.set(LoginCkKey, biliLoginCk, { EX: 3600 * 24 * 360 });
    }
    else {
        e.reply('扫码超时');
    }
}
/** 读取扫码登陆后缓存的cookie */
async function readLoginCookie() {
    const CK_KEY = 'Yz:yuki:bili:loginCookie';
    const tempCk = await redis.get(CK_KEY);
    return tempCk ? tempCk : '';
}
/** 读取手动绑定的B站ck */
async function readLocalBiliCk() {
    const dir = path.join(_paths.root, 'data/yuki-plugin/');
    if (!fs__default.existsSync(dir)) {
        fs__default.mkdirSync(dir, { recursive: true }); // 创建目录，包括父目录
    }
    const files = fs__default.readdirSync(dir).filter((file) => file.endsWith('.yaml'));
    const readFile = promisify(fs__default.readFile);
    const promises = files.map((file) => readFile(path.join(dir, file), 'utf8'));
    const contents = await Promise.all(promises);
    const Bck = contents.map((content) => YAML.parse(content));
    return Bck[0];
}
/** 覆盖保存手动获取绑定的B站ck */
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
/** 读取缓存的tempCK */
async function readTempCk() {
    const CK_KEY = 'Yz:yuki:bili:tempCookie';
    const tempCk = await redis.get(CK_KEY);
    if (!tempCk) {
        const newTempCk = await getNewTempCk();
        await saveTempCk(newTempCk);
        const result = await postGateway(newTempCk);
        const data = await result.data; // 解析校验结果
        if (data?.code !== 0) {
            logger?.error(`优纪插件：tempCK，Gateway校验失败：${JSON.stringify(data)}`);
        }
        else if (data?.code === 0) {
            logger?.mark(`优纪插件：tempCK，Gateway校验成功：${JSON.stringify(data)}`);
        }
        return newTempCk;
    }
    else {
        return tempCk;
    }
}
/**保存tempCK*/
async function saveTempCk(newTempCk) {
    const CK_KEY = 'Yz:yuki:bili:tempCookie';
    await redis.set(CK_KEY, newTempCk, { EX: 3600 * 24 * 180 });
}
/** 综合获取ck，返回优先级：localCK > loginCK > tempCK */
async function readSyncCookie() {
    const localCk = await readLocalBiliCk();
    const tempCk = await readTempCk();
    const loginCk = await readLoginCookie();
    const validCk = (ck) => ck?.trim().length > 10;
    if (validCk(localCk)) {
        return { cookie: localCk, mark: 'localCk' };
    }
    else if (validCk(loginCk)) {
        return { cookie: loginCk + ';', mark: 'loginCk' };
    }
    else if (validCk(tempCk)) {
        return { cookie: tempCk, mark: 'tempCk' };
    }
    else {
        return { cookie: '', mark: 'ckIsEmpty' };
    }
}
/**
 * 综合读取、筛选 传入的或本地或redis存储的cookie的item
 * @param {string} mark 读取存储的CK类型，'localCK' 'tempCK' 'loginCK' 或传入值 'xxx'并进行筛选
 * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid']
 * @param {boolean} isInverted 控制正取和反取，true为反取，false为正取
 * @returns {string}
 **/
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
        .match(/(\w+)=([^;|,]+)/g) //正则 /(\w+)=([^;]+);/g 匹配 a=b 的内容，并分组为 [^;|,]+ 来匹配值，其中 [^;|,] 表示除了分号和,以外的任意字符
        ?.map(match => match.split('='))
        .filter(([key, value]) => (isInverted ? !items.includes(key) : items.includes(key)) && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join(';') || '';
    return cookiePairs;
}
// 取反读取ck、筛选 传入的或本地或redis存储的cookie的item
async function readSavedCookieOtherItems(mark, items) {
    return await readSavedCookieItems(mark, items, true);
}
/** 生成 _uuid */
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
/**生成 b_lsid */
async function gen_b_lsid() {
    function get_random_str(length) {
        return Array.from({ length }, () => Math.floor(Math.random() * 16)
            .toString(16)
            .toUpperCase()).join('');
    }
    const timestamp = Date.now();
    const randomPart = get_random_str(8);
    const timestampHex = timestamp.toString(16).toUpperCase();
    return `b_lsid=${randomPart}_${timestampHex};`;
}
/** 获取 buvid3 和 buvid4 */
async function getBuvid3_4(uuid) {
    const url = 'https://api.bilibili.com/x/frontend/finger/spi/';
    const headers = lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
        Cookie: `_uuid=${uuid}`,
        Host: 'api.bilibili.com',
        Origin: 'https://www.bilibili.com',
        Referer: 'https://www.bilibili.com/'
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
/**获取新的tempCK*/
async function getNewTempCk() {
    const uuid = await genUUID();
    const b_nut = `b_nut=${Math.floor(Date.now() / 1000)};`;
    const buvid3_buvid4 = await getBuvid3_4(uuid);
    const b_lsid = await gen_b_lsid();
    const buvid_fp = await get_buvid_fp(uuid);
    return `${uuid}${buvid3_buvid4}${b_lsid}${buvid_fp}${b_nut}`;
}
/**
 * *******************************************************************
 * 风控相关函数
 * *******************************************************************
 */
/**
 * 请求参数POST接口(ExClimbWuzhi)过校验
 * @param cookie 请求所需的cookie
 * @returns 返回POST请求的结果
 */
async function postGateway(cookie) {
    const _uuid = await readSavedCookieItems(cookie, ['_uuid'], false);
    const payloadJsonData = await BiliApi.BILIBILI_BROWSER_DATA(_uuid);
    const data = { payload: JSON.stringify(payloadJsonData) };
    const requestUrl = 'https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi';
    const config = {
        headers: lodash.merge({}, BiliApi.BILIBILI_HEADERS, {
            'Cookie': cookie,
            'Content-type': 'application/json;charset=UTF-8'
        }, {
            Host: 'api.bilibili.com',
            Origin: 'https://www.bilibili.com',
            Referer: 'https://www.bilibili.com/'
        })
    };
    try {
        const res = await axios.post(requestUrl, data, config);
        return res;
    }
    catch (error) {
        logger.error('Error making POST request:', error);
        throw error;
    }
}
/**生成buvid_fp
 * @param {string} uuid
 */
async function get_buvid_fp(cookie) {
    const uuid = await readSavedCookieItems(cookie, ['_uuid'], false);
    const fingerprintData = BiliApi.BILIBILI_FINGERPRINT_DATA(uuid);
    const buvidFp = gen_buvid_fp(fingerprintData);
    return `buvid_fp=${buvidFp};`;
}
/**
 * 获取有效bili_ticket并添加到cookie
 * @param {string} cookie
 * @returns {Promise<{ cookie: string; }>} 返回包含最新有效的bili_ticket的cookie
 */
async function cookieWithBiliTicket(cookie) {
    const BiliJctKey = 'Yz:yuki:bili:bili_ticket';
    cookie = await readSavedCookieItems(cookie, ['bili_ticket'], true);
    const biliTicket = await redis.get(BiliJctKey);
    if (!biliTicket) {
        try {
            const csrf = await readSavedCookieItems(cookie, ['bili_jct'], false);
            const { ticket, ttl } = await getBiliTicket(csrf);
            await redis.set(BiliJctKey, ticket, { EX: ttl });
            if (ticket && ttl) {
                await redis.set(BiliJctKey, ticket, { EX: ttl });
                return cookie + `;bili_ticket=${ticket};`;
            }
            else {
                return cookie;
            }
        }
        catch (error) {
            logger?.error(`${error}`);
            return cookie;
        }
    }
    else {
        return cookie + `;bili_ticket=${biliTicket};`;
    }
}

export { applyLoginQRCode, checkBiliLogin, cookieWithBiliTicket, exitBiliLogin, genUUID, gen_b_lsid, getNewTempCk, get_buvid_fp, pollLoginQRCode, postGateway, readSavedCookieItems, readSavedCookieOtherItems, readSyncCookie, readTempCk, saveLocalBiliCk, saveLoginCookie, saveTempCk };
