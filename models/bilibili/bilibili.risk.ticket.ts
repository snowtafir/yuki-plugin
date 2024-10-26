import fetch from 'node-fetch';
import { createHmac } from 'crypto';
import BiliApi from '@/models/bilibili/bilibili.main.api';

/**
 * Generate HMAC-SHA256 signature
 * @param {string} key     The key string to use for the HMAC-SHA256 hash
 * @param {string} message The message string to hash
 * @returns {string} The HMAC-SHA256 signature as a hex string
 */
function hmacSha256(key: string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Get Bilibili web ticket
 * @param {string | null} csrf CSRF token, can be empty or null, or the cookie's bili_jct value
 * @returns {Promise<{ code: number, ticket: string, created_at: number, ttl: number }>}
 * Promise that resolves to an object containing code, ticket, created_at, and ttl values
 */
export async function getBiliTicket(csrf: string | null): Promise<{ code?: number; ticket?: string; created_at?: number; ttl?: number }> {
  const ts = Math.floor(Date.now() / 1000);
  const hexSign = hmacSha256('XgwSnGZ1p', `ts${ts}`);
  const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';

  const params = new URLSearchParams({
    'key_id': 'ec02',
    'hexsign': hexSign,
    'context[ts]': String(ts),
    'csrf': csrf ?? '' // 使用空字符串代替null
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'User-Agent': BiliApi.BILIBILI_HEADERS['User-Agent']
      }
    });

    if (!response.ok) {
      throw new Error(`get bili_jct HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      if (data.code === 400) {
        throw new Error(`get bili_jct Parameter error! ${data.message}`);
      }
      throw new Error(`Failed to retrieve bili ticket: ${data.message}`);
    }

    // 返回所需的对象结构
    return {
      code: data.code,
      ticket: data.data?.ticket,
      created_at: data.data?.created_at,
      ttl: data.data?.ttl
    };
  } catch (error) {
    throw new Error(`Failed to fetch Bilibili ticket: ${error instanceof Error ? error.message : String(error)}`);
  }
}
