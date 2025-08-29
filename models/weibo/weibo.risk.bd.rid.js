import WeiboApi from './weibo.main.api.js';
import lodash from 'lodash';
import crypto from 'crypto';

/**
 * 生成更真实的鼠标轨迹数据（贝塞尔曲线模拟）
 * @returns {Array<Array<number>>} 鼠标轨迹数据 [[x偏移, y偏移, 时间戳], ...]
 */
function generateRealisticMouseTrack() {
    const tracks = [];
    const now = Date.now();
    // 生成最近5分钟内的时间点
    const startTime = now - 5 * 60 * 1000;
    const endTime = now;
    // 起始点和结束点
    const startX = Math.floor(Math.random() * 200);
    const startY = Math.floor(Math.random() * 200);
    const endX = 200 + Math.floor(Math.random() * 800); // 页面常见宽度范围内
    const endY = 100 + Math.floor(Math.random() * 600); // 页面常见高度范围内
    // 控制点（用于贝塞尔曲线）
    const controlX = startX + (endX - startX) * 0.3 + Math.random() * 200 - 100;
    const controlY = startY + (endY - startY) * 0.7 + Math.random() * 200 - 100;
    // 生成轨迹点数量
    const pointCount = 30 + Math.floor(Math.random() * 40);
    // 时间间隔
    let currentTime = startTime;
    const timeStep = (endTime - startTime) / pointCount;
    for (let i = 0; i <= pointCount; i++) {
        const t = i / pointCount;
        // 二次贝塞尔曲线计算当前位置
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
        // 计算与上一个点的偏移量
        if (i === 0) {
            // 第一个点，偏移量为0
            tracks.push([0, 0, Math.floor(currentTime)]);
        }
        else {
            const prevPoint = tracks[tracks.length - 1];
            const deltaX = Math.round(x - (prevPoint[0] + prevPoint[0])); // 简化计算
            const deltaY = Math.round(y - (prevPoint[1] + prevPoint[1]));
            tracks.push([deltaX, deltaY, Math.floor(currentTime)]);
        }
        // 更新时间戳
        currentTime += timeStep + (Math.random() * 200 - 100); // 添加随机波动
    }
    return tracks;
}
/**
 * 生成浏览器指纹数据
 * @returns {Object} 包含浏览器指纹信息的对象
 */
function generateFingerprint() {
    const fingerprintData = { fp: {}, bh: {}, r: {} };
    // 浏览器指纹信息
    fingerprintData.fp = {
        // 版本信息
        0: '1.2.1',
        // 是否支持某特性（布尔值）
        1: {
            s: 1,
            v: false
        },
        // 语言信息
        2: {
            s: 1,
            v: ['lang']
        },
        // User Agent 字符串
        3: {
            s: 1,
            v: WeiboApi.USER_AGENT.replace(/Mozilla\//g, '')
        },
        // 错误信息
        4: {
            s: 1,
            v: "TypeError: Cannot read properties of null (reading '0')\n    at W (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:14066)\n    at Object.NiOqR (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:3108)\n    at https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:29253\n    at Array.map (<anonymous>)\n    at je (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:29193)\n    at Object.Qhlex (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:5250)\n    at Ie (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:25296)\n    at Object.NsuAP (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:4977)\n    at Pe (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:24928)\n    at Module.Ve [as get] (https://passport.sinaimg.cn/js/fp/1.2.1.umd.js:1:24667)"
        },
        // 数值型数据
        5: {
            s: 1,
            v: 33
        },
        // 函数字符串表示
        6: {
            s: 1,
            v: 'function bind() { [native code] }'
        },
        // 语言环境
        7: {
            s: 1,
            v: [['zh-CN']]
        },
        // 布尔值
        8: {
            s: 1,
            v: true
        },
        // 布尔值
        9: {
            s: 1,
            v: false
        },
        // 布尔值
        10: {
            s: 1,
            v: true
        },
        // 数值
        11: {
            s: 1,
            v: 5
        },
        // 错误信息
        12: {
            s: -1,
            e: ''
        },
        // 日期字符串
        13: {
            s: 1,
            v: '20030107'
        },
        // 数值
        14: {
            s: 1,
            v: 50
        },
        // 完整的 User Agent
        15: {
            s: 1,
            v: WeiboApi.USER_AGENT
        },
        // WebGL 信息
        16: {
            s: 1,
            v: {
                vendor: 'WebKit',
                renderer: 'WebKit WebGL'
            }
        },
        // 外部对象字符串表示
        17: {
            s: 1,
            v: '[object External]'
        },
        // 屏幕尺寸信息
        18: {
            s: 1,
            v: {
                ow: 1920,
                oh: 1152,
                iw: 257,
                ih: 1031
            }
        },
        // 浏览器名称
        19: {
            s: 1,
            v: 'chrome'
        },
        // 浏览器内核
        20: {
            s: 1,
            v: 'chromium'
        },
        // 布尔值
        21: {
            s: 1,
            v: false
        },
        // 布尔值
        22: {
            s: 1,
            v: true
        },
        // 触摸支持信息
        23: {
            s: 1,
            v: {
                ots: false,
                mtp: 0,
                mmtp: -1
            }
        }
    };
    // 行为数据（鼠标轨迹和键盘操作）
    fingerprintData.bh = {
        // 鼠标移动轨迹 [x偏移, y偏移, 时间戳毫秒]
        mt: generateRealisticMouseTrack(),
        // 键盘操作统计
        kt: {
            down: 0,
            up: 0
        }
    };
    // 追踪设置
    fingerprintData.r = {
        isTraceKeyboard: true,
        isTraceMouse: true
    };
    return fingerprintData;
}
/**
 * 生成 AES 加密密钥和初始化向量
 * @returns {Promise<Object>} 包含 key 和 iv 的对象
 */
function generateAESKey() {
    // 生成 AES 密钥 (16位)
    const key = crypto.randomBytes(16);
    // 生成初始化向量
    const iv = crypto.randomBytes(16);
    return {
        key: Buffer.from(key).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
    };
}
/**
 * RSA 加密函数 (模拟浏览器 Web Crypto API)
 * @param {string} data - 待加密数据
 * @param {Uint8Array} publicKeyDer - DER 格式的公钥
 * @returns {Buffer} 加密后的数据
 */
function rsaEncrypt(data, publicKeyDer) {
    // 将 DER 格式的公钥转换为 PEM 格式
    const base64Key = Buffer.from(publicKeyDer).toString('base64');
    const keyLines = base64Key.match(/.{1,64}/g) ?? [];
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${keyLines.join('\n')}\n-----END PUBLIC KEY-----`;
    // 使用 RSA-OAEP-SHA256 算法加密
    return crypto.publicEncrypt({
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, Buffer.from(data, 'binary'));
}
/**
 * AES CBC 加密函数 (模拟浏览器 Web Crypto API)
 * @param {string} data - 待加密数据
 * @param {string} keyBase64 - Base64 编码的密钥
 * @param {string} ivBase64 - Base64 编码的初始化向量
 * @returns {string} Base64 编码的加密结果
 */
function aesEncrypt(data, keyBase64, ivBase64) {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(data, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    return Buffer.from(encrypted, 'binary').toString('base64');
}
/**
 * 数据加密主函数
 * @param {string} jsonData - JSON 格式的指纹数据
 * @returns {Promise<string>} 加密后的数据
 */
async function encryptData(jsonData) {
    // 原始的 RSA 公钥（DER 格式），与源代码完全一致
    const publicKeyDer = new Uint8Array([
        48, 129, 159, 48, 13, 6, 9, 42, 134, 72, 134, 247, 13, 1, 1, 1, 5, 0, 3, 129, 141, 0, 48, 129, 137, 2, 129, 129, 0, 180, 249, 101, 74, 227, 247, 222, 230,
        24, 220, 10, 149, 183, 131, 164, 185, 20, 166, 164, 114, 158, 71, 46, 151, 77, 71, 226, 23, 78, 67, 177, 246, 197, 249, 213, 39, 243, 55, 38, 112, 17, 64,
        135, 155, 109, 50, 185, 61, 21, 105, 106, 245, 148, 212, 127, 7, 18, 227, 255, 40, 199, 241, 65, 211, 167, 185, 232, 5, 186, 189, 245, 59, 161, 214, 48,
        160, 251, 21, 92, 187, 172, 83, 152, 11, 85, 72, 37, 137, 87, 104, 63, 39, 86, 6, 150, 84, 6, 178, 229, 220, 144, 133, 131, 212, 47, 139, 232, 185, 192, 97,
        89, 137, 170, 141, 39, 19, 85, 4, 153, 238, 75, 93, 243, 96, 206, 72, 135, 91, 2, 3, 1, 0, 1
    ]);
    // 生成 AES 密钥和 IV
    const { key, iv } = generateAESKey();
    // RSA 加密 AES 密钥（将密钥重复两次后加密）
    const keyBinary = Buffer.from(key, 'base64').toString('binary');
    const encryptedKey = rsaEncrypt(keyBinary + keyBinary, publicKeyDer);
    // AES 加密数据
    const encryptedData = aesEncrypt(jsonData, key, iv);
    // 组合加密数据（与原始代码保持一致的格式）
    const result = '01' + Buffer.from('01' + encryptedKey.toString('binary') + '02' + Buffer.from(encryptedData, 'base64').toString('binary')).toString('base64');
    return result;
}
/**
 * 生成请求载荷
 * @returns {Promise<string>} 加密后的载荷数据
 */
async function genBdPayload() {
    const fingerprint = generateFingerprint();
    const jsonString = JSON.stringify(fingerprint);
    const encryptedData = await encryptData(jsonString);
    return encryptedData;
}
/**
 * 访问bd接口获取rid
 * @param {string} X_CSRF_TOKEN - X_CSRF_TOKEN
 * @returns {Promise<JSON>} 服务器响应结果
 */
async function getRidFromBd(X_CSRF_TOKEN) {
    const params = new URLSearchParams();
    const payload = await genBdPayload();
    payload && params.append('data', payload);
    params.append('from', 'weibo');
    const ridData = (await fetch('https://passport.weibo.com/sso/bd', {
        method: 'POST',
        headers: lodash.merge(WeiboApi.WEIBO_GET_BD_TOKEN_HEADERS, {
            Origin: 'https://passport.weibo.com',
            Cookie: `X-CSRF-TOKEN=${X_CSRF_TOKEN}`
        }),
        body: params,
        redirect: 'follow'
    }).then(res => res.json()));
    return ridData;
}

export { genBdPayload, getRidFromBd };
