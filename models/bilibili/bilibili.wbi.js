import md5 from 'md5';
import fetch from 'node-fetch';

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
];
const getMixinKey = (orig) => mixinKeyEncTab
    .map((n) => orig[n])
    .join("")
    .slice(0, 32);
function encWbi(params, img_key, sub_key) {
    const mixin_key = getMixinKey(img_key + sub_key), curr_time = Math.round(Date.now() / 1000), chr_filter = /[!'()*]/g;
    Object.assign(params, { wts: curr_time });
    const query = Object.keys(params)
        .sort()
        .map((key) => {
        const value = params[key].toString().replace(chr_filter, "");
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
        .join("&");
    const wbi_sign = md5(query + mixin_key);
    return {
        query: query,
        w_rid: wbi_sign,
        time_stamp: curr_time
    };
}
async function getWbiKeys(headers, cookie) {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
        headers: {
            Cookie: cookie,
            'User-Agent': headers['User-Agent'],
            Referer: 'https://www.bilibili.com/'
        }
    });
    const { data: { wbi_img: { img_url, sub_url }, }, } = (await res.json());
    return {
        img_key: img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.')),
        sub_key: sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'))
    };
}
async function getWbiSign(params, headers, cookie) {
    const { img_key, sub_key } = await getWbiKeys(headers, cookie);
    return encWbi(params, img_key, sub_key);
}

export { getWbiSign };
