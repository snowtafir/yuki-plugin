import { createHmac } from 'crypto';
import { BiliApi } from './bilibili.api.js';

function hmacSha256(key, message) {
    return createHmac('sha256', key).update(message).digest('hex');
}
async function getBiliTicket(csrf) {
    const ts = Math.floor(Date.now() / 1000);
    const hexSign = hmacSha256('XgwSnGZ1p', `ts${ts}`);
    const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';
    const params = new URLSearchParams({
        key_id: 'ec02',
        hexsign: hexSign,
        'context[ts]': String(ts),
        csrf: csrf ?? ''
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
        return {
            code: data.code,
            ticket: data.data?.ticket,
            created_at: data.data?.created_at,
            ttl: data.data?.ttl
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch Bilibili ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export { getBiliTicket };
