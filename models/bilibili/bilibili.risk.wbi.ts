import md5 from 'md5';
import fetch from 'node-fetch';
import BiliApi from '@/models/bilibili/bilibili.main.api';

declare const redis: any;

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26,
  17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string) =>
  mixinKeyEncTab
    .map(n => orig[n])
    .join('')
    .slice(0, 32);

// 为请求参数进行 wbi 签名
function encWbi(params: { [key: string]: string | number | object }, img_key: string, sub_key: string) {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g;

  Object.assign(params, { wts: curr_time }); // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object.keys(params)
    .sort()
    .map(key => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const wbi_sign = md5(query + mixin_key); // 计算 w_rid

  //return query + "&w_rid=" + wbi_sign;
  return {
    query: query,
    w_rid: wbi_sign,
    time_stamp: curr_time
  };
}
// 获取最新的 img_key 和 sub_key
async function getWbiKeys(headers, cookie) {
  const IMG_SUB_KEY = 'Yz:yuki:bili:wbi_img_key';
  const wbi_img_data: string | null = await redis.get(IMG_SUB_KEY);
  if (wbi_img_data) {
    const wbi_img_data_json = JSON.parse(wbi_img_data);
    return {
      img_key: wbi_img_data_json.img_key,
      sub_key: wbi_img_data_json.sub_key
    };
  } else {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        // SESSDATA 字段
        'Cookie': cookie,
        'User-Agent': headers['User-Agent'],
        'Referer': 'https://www.bilibili.com/' //对于直接浏览器调用可能不适用
      }
    });
    const {
      data: {
        wbi_img: { img_url, sub_url }
      }
    } = (await res.json()) as {
      data: {
        wbi_img: { img_url: string; sub_url: string };
      };
    };
    const wbi_img_data = {
      img_key: img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.')),
      sub_key: sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'))
    };

    const { microtime } = await getTimeStamp(); // 获取的 microtime 已经是北京时间（毫秒）

    // 创建当前北京时间的 Date 对象
    const current_zh_cn_Time = new Date(microtime);

    // 打印当前北京时间
    console.log(`当前北京时间: ${current_zh_cn_Time}`);

    // 创建明天0点的时间对象
    const tomorrow = new Date(current_zh_cn_Time);
    tomorrow.setHours(0, 0, 0, 0); // 设置明天的0点
    tomorrow.setDate(tomorrow.getDate() + 1); // 日期加1，表示明天

    // 计算剩余秒数
    const secondsUntilTomorrow = Math.floor((tomorrow.getTime() - current_zh_cn_Time.getTime()) / 1000);

    console.log(`距离明天还剩: ${secondsUntilTomorrow} 秒`);

    await redis.set(IMG_SUB_KEY, JSON.stringify(wbi_img_data), { EX: secondsUntilTomorrow - 2 }); // 设置缓存，过期时间为第二天0点前2秒

    return wbi_img_data;
  }
}

/**获取适用于 RTC 的时间戳*/
async function getTimeStamp() {
  const res = await fetch(BiliApi.BILIBIL_API.biliServerTimeStamp, {
    method: 'GET',
    headers: {
      'Host': 'api.live.bilibili.com',
      'User-Agent': `${BiliApi.USER_AGENT}`
    }
  });
  const {
    data: { timestamp, microtime }
  } = (await res.json()) as {
    data: {
      timestamp: number;
      microtime: number;
    };
  };
  return {
    timestamp: timestamp,
    microtime: microtime
  };
}

/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md#javascript
 * 对实际请求参数进行 wbi 签名, 生成 wbi 签名
 * @param {object} params 除了 wbi 签名外的全部请求参数，例如 api get请求的查询参数 { uid: 12345678, jsonp: jsonp}
 * @param {object} headers 必需要 referer 和 UA 两个请求头
 */
export async function getWbiSign(params: any, headers: any, cookie: string) {
  const { img_key, sub_key } = await getWbiKeys(headers, cookie);
  return encWbi(params, img_key, sub_key);
}
