/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md#javascript
 * 对实际请求参数进行 wbi 签名, 生成 wbi 签名
 * @param {object} params 除了 wbi 签名外的全部请求参数，例如 api get请求的查询参数 { uid: 12345678, jsonp: jsonp}
 * @param {object} headers 必需要 referer 和 UA 两个请求头
 */
export declare function getWbiSign(params: any, headers: any, cookie: string): Promise<{
    query: string;
    w_rid: string;
    time_stamp: number;
}>;
