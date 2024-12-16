/**
 * Get Bilibili web ticket
 * @param {string | null} csrf CSRF token, can be empty or null, or the cookie's bili_jct value
 * @returns {Promise<{ code: number, ticket: string, created_at: number, ttl: number }>}
 * Promise that resolves to an object containing code, ticket, created_at, and ttl values
 */
export declare function getBiliTicket(csrf: string | null): Promise<{
    code?: number;
    ticket?: string;
    created_at?: number;
    ttl?: number;
}>;
