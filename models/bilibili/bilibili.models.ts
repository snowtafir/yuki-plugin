import axios from 'axios';
import fs from "fs";
import lodash from 'lodash';
import fetch from 'node-fetch';
import { promisify } from 'node:util';
import path from 'path';
import QRCode from 'qrcode';
import YAML from "yaml";
import { LoginProps } from "@/components/loginQrcode/Page";
import Image from '@/utils/image';
import { _paths } from '@/utils/paths';
import { ScreenshotOptions } from '@/utils/puppeteer.render';
import { BiliApi } from '@/models/bilibili/bilibili.api';
import { gen_buvid_fp } from '@/models/bilibili/bilibili.buid.fp';

declare const logger: any, Bot: any, redis: any, segment: any;

/**
* *******************************************************************
* Login 相关
* *******************************************************************
*/
/**申请登陆二维码(web端) */
export async function applyLoginQRCode(e: any) {
  const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header';
  const response = await fetch(url, {
    method: "GET",
    headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'user-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { 'Host': 'passport.bilibili.com', }),
    redirect: "follow",
  });
  const res: any = await response.json();

  if (res?.code === 0) {
    const qrcodeKey = res.data.qrcode_key;
    const qrcodeUrl = res.data.url;
    let loginUrlQrcodeData = await QRCode.toDataURL(`${qrcodeUrl}`);
    const LoginPropsData: LoginProps = {
      data: { url: loginUrlQrcodeData }
    };
    const ScreenshotOptionsData: ScreenshotOptions = {
      saveHtmlfile: false,
      modelName: "bili-login"
    }
    const qrCodeImage = await Image.renderPage("bili-login", "LoginQrcodePage", LoginPropsData, ScreenshotOptionsData);
    let qrcodeImg: Buffer[]
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
  } else {
    e.reply(`获取B站登录二维码失败: ${res.data.message}`);
    throw new Error(`获取B站登录二维码失败: ${res.data.message}`);
  }
}

/**处理扫码结果 */
export async function pollLoginQRCode(e: any, qrcodeKey: string) {
  const url = `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcodeKey}&source=main-fe-header`;
  const response = await fetch(url, {
    method: "GET",
    headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { 'Host': 'passport.bilibili.com', }),
    redirect: "follow",
  });
  const data: any = await response.json();

  if (data.code === 0) {
    if (data.data.code === 0) {
      // 登录成功，获取 cookie
      const LoginCookie = response.headers.get('set-cookie');
      e.reply(`~B站登陆成功~`);
      return LoginCookie;
    } else if (data.data.code === 86101) {
      // 未扫码
      // 继续轮询
      await new Promise((resolve) => setTimeout(resolve, 2000));
      (logger ?? Bot.logger)?.mark(`优纪插件：扫码B站登录：未扫码，轮询中...`);
      return pollLoginQRCode(e, qrcodeKey);
    } else if (data.data.code === 86090) {
      // 已扫码未确认
      // 继续轮询
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return pollLoginQRCode(e, qrcodeKey);
    } else if (data.data.code === 86038) {
      // 二维码已失效
      e.reply('B站登陆二维码已失效');
      return null;
    } else {
      e.reply('处理扫码结果出错');
      throw new Error(`处理扫码结果出错: ${data?.data?.message}`);
    }
  } else {
    e.reply('处理扫码结果出错');
    throw new Error(`处理扫码结果出错: ${data?.message}`);
  }
}

/**查看app扫码登陆获取的ck的有效状态*/
export async function checkBiliLogin(e: any) {
  const LoginCookie = await readLoginCookie();
  const res = await fetch("https://api.bilibili.com/x/web-interface/nav", {
    method: "GET",
    headers: lodash.merge(BiliApi.BIlIBILI_LOGIN_HEADERS, { 'User-agent': BiliApi.BILIBILI_HEADERS['User-Agent'] }, { "Cookie": `${LoginCookie}`, }),
    redirect: "follow",
  });
  const resData: any = await res.json()
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
  } else {
    // 处理其他情况
    return;
  }
}

/**退出B站账号登录，将会删除redis缓存的LoginCK，并在服务器注销该登录 Token (SESSDATA)*/
export async function exitBiliLogin(e: any) {
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
    } else {
      e.reply("服务器响应异常，退出登录请求出错");
    }
  } catch (error) {
    console.error('Error during Bili login exit:', error);
    e.reply("退出登录请求出错，请稍后再试");
  }
}

/**
* *******************************************************************
* cookie相关
* *******************************************************************
*/

/**保存扫码登录的loginCK*/
export async function saveLoginCookie(e: any, biliLoginCk: string) {
  if (biliLoginCk && biliLoginCk.length > 0) {
    const LoginCkKey = "Yz:yuki:bili:loginCookie";
    redis.set(LoginCkKey, biliLoginCk, { EX: 3600 * 24 * 360 });
  } else {
    e.reply("扫码超时");
  }
}

/** 读取扫码登陆后缓存的cookie */
async function readLoginCookie() {
  const CK_KEY = "Yz:yuki:bili:loginCookie";
  const tempCk = await redis.get(CK_KEY);

  return tempCk ? tempCk : '';
}

/** 读取手动绑定的B站ck */
async function readLocalBiliCk() {
  const dir = path.join(_paths.root, 'data/yuki-plugin/');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // 创建目录，包括父目录
  }

  const files = fs.readdirSync(dir).filter((file: string) => file.endsWith('.yaml'));
  const readFile = promisify(fs.readFile);

  const promises = files.map((file: any) => readFile(path.join(dir, file), 'utf8'));
  const contents = await Promise.all(promises);

  const Bck = contents.map((content: any) => YAML.parse(content));
  return Bck[0];
}

/** 覆盖保存手动获取绑定的B站ck */
export async function saveLocalBiliCk(data: any) {
  const dirPath = path.join(_paths.root, 'data/yuki-plugin/');
  const filePath = path.join(dirPath, 'biliCookie.yaml');
  const cleanedData = String(data).replace(/\s/g, '').trim();

  if (lodash.isEmpty(cleanedData)) {
    fs.existsSync(filePath) && fs.unlinkSync(filePath);
  } else {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const yamlContent = YAML.stringify(cleanedData);
    fs.writeFileSync(filePath, yamlContent, 'utf8');
  }
}

/** 读取缓存的tempCK */
export async function readTempCk() {
  const CK_KEY = "Yz:yuki:bili:tempCookie";
  const tempCk = await redis.get(CK_KEY);
  return tempCk ?? '';
}

/**保存tempCK*/
export async function saveTempCk(newTempCk: any) {
  const CK_KEY = "Yz:yuki:bili:tempCookie";
  await redis.set(CK_KEY, newTempCk, { EX: 3600 * 24 * 180 });
}

/** 综合获取ck，返回优先级：localCK > loginCK > tempCK */
export async function readSyncCookie() {
  const localCk = await readLocalBiliCk();
  const tempCk = await readTempCk();
  const loginCk = await readLoginCookie();

  const validCk = (ck: string) => ck?.trim().length > 10;

  if (validCk(localCk)) {
    return { cookie: localCk, mark: "localCk" };
  } else if (validCk(loginCk)) {
    return { cookie: loginCk + ";", mark: "loginCk" };
  } else if (validCk(tempCk)) {
    return { cookie: tempCk, mark: "tempCk" };
  } else {
    return { cookie: '', mark: "ckIsEmpty" };
  }
}

/**
 * 综合读取、筛选 传入的或本地或redis存储的cookie的item
 * @param {string} mark 读取存储的CK类型，'localCK' 'tempCK' 'loginCK' 或传入值 'xxx'并进行筛选
 * @param {Array} items 选取获取CK的项 选全部值：items[0] = 'all' ，或选取其中的值 ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid']
 * @param {boolean} isInverted 控制正取和反取，true为反取，false为正取
 * @returns {string}
 **/
export async function readSavedCookieItems(mark: string, items: Array<string>, isInverted = false): Promise<string> {
  let ckString: string;

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
export async function readSavedCookieOtherItems(mark: string, items: Array<string>) {
  return await readSavedCookieItems(mark, items, true);
}

/** 生成 _uuid */
export async function genUUID() {
  const generatePart = (length: number) =>
    Array.from({ length }, () => Math.floor(16 * Math.random()))
      .map(num => num.toString(16).toUpperCase())
      .join('');

  const padLeft = (str: string, length: number) =>
    str.padStart(length, '0');

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
export async function gen_b_lsid() {
  function get_random_str(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
  }

  const timestamp = Date.now();
  const randomPart = get_random_str(8);
  const timestampHex = timestamp.toString(16).toUpperCase();

  return `b_lsid=${randomPart}_${timestampHex};`;
}

/** 获取 buvid3 和 buvid4 */
async function getBuvid3_4(uuid: string): Promise<string> {
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
  } else {
    return '';
  }
}

/**获取新的tempCK*/
export async function getNewTempCk() {

  const uuid = await genUUID();
  const buvid3_buvid4 = await getBuvid3_4(uuid);
  const b_lsid = await gen_b_lsid();
  //const buvid_fp = await get_buvid_fp(uuid);

  let newTempCk = `${uuid}${buvid3_buvid4}${b_lsid}`//${buvid_fp}`;

  await saveTempCk(newTempCk);

  const result = await postGateway(newTempCk);

  const { code, data } = await result.data; // 解析校验结果

  if (code !== 0) {
    logger?.mark(`优纪插件：tempCK，Gateway校验失败：${JSON.stringify(data)}`);
  } else if (code === 0) {
    logger?.mark(`优纪插件：tempCK，Gateway校验成功：${JSON.stringify(data)}`);
  }
}


/**
* *******************************************************************
* 风控相关函数
* *******************************************************************
*/
/**获取GatWay payload */
async function getPayload(cookie: string) {
  const payloadOriginData = {
    "3064": 1, // ptype, mobile => 2, others => 1
    "5062": `${Date.now()}`, // timestamp
    "03bf": "https://www.bilibili.com/", // url accessed
    "39c8": "333.999.fp.risk",
    "34f1": "", // target_url, default empty now
    "d402": "", // screenx, default empty
    "654a": "", // screeny, default empty
    "6e7c": "878x1066",// browser_resolution, window.innerWidth || document.body && document.body.clientWidth + "x" + window.innerHeight || document.body && document.body.clientHeight
    "3c43": {// 3c43 => msg
      "2673": 0,// hasLiedResolution, window.screen.width < window.screen.availWidth || window.screen.height < window.screen.availHeight
      "5766": 24, // colorDepth, window.screen.colorDepth
      "6527": 0,// addBehavior, !!window.HTMLElement.prototype.addBehavior, html5 api
      "7003": 1,// indexedDb, !!window.indexedDB, html5 api
      "807e": 1,// cookieEnabled, navigator.cookieEnabled
      "b8ce": BiliApi.BILIBILI_HEADERS['User-Agent'], // ua "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
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
      "adca": BiliApi.BILIBILI_HEADERS['User-Agent'].includes('Windows') ? 'Win32' : 'Linux', // platform, navigator.platform
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
    "df35": `${await readSavedCookieItems(cookie, ['_uuid'], false)}`, // _uuid, set from cookie, generated by client side(algorithm remains unknown)
    "07a4": "zh-CN",
    "5f45": null,
    "db46": 0
  }
  return JSON.stringify(payloadOriginData);
}

/**
 * 请求参数POST接口(ExClimbWuzhi)过校验
 * @param cookie 请求所需的cookie
 * @returns 返回POST请求的结果
 */
export async function postGateway(cookie: string) {
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
  } catch (error) {
    logger.error('Error making POST request:', error);
    throw error;
  }
}

/**生成buvid_fp
 * @param {string} uuid
*/
export async function get_buvid_fp(cookie: string) {
  const uuid = await readSavedCookieItems(cookie, ['_uuid'], false)
  const seedget = Math.floor(Math.random() * (60 - 1 + 1) + 1);
  let buvidFp = gen_buvid_fp(uuid, seedget);
  return `buvid_fp=${buvidFp};`;
}
