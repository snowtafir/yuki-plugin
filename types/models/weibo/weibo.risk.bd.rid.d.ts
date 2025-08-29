/**
 * 生成请求载荷
 * @returns {Promise<string>} 加密后的载荷数据
 */
export declare function genBdPayload(): Promise<string>;
/**
 * 访问bd接口获取rid
 * @param {string} X_CSRF_TOKEN - X_CSRF_TOKEN
 * @returns {Promise<JSON>} 服务器响应结果
 */
export declare function getRidFromBd(X_CSRF_TOKEN: string): Promise<{
    retcode?: number;
    msg?: string;
    data?: {
        rid?: string;
    };
}>;
