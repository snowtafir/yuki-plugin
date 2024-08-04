import moment from 'moment';
import fetch from 'node-fetch';
import { WeiboApi } from './weibo.api.js';
import { JSDOM } from 'jsdom';

class WeiboQuery {
    static getDynamicId(post) {
        return post?.mblog?.mid || post?.mblog?.id;
    }
    static filterCardTypeCustom(raw_post) {
        return raw_post.card_type === 9;
    }
    static getDynamicCreatetDate(raw_post) {
        const created_time = Date.parse(raw_post?.mblog?.created_at || raw_post?.created_at);
        return created_time;
    }
    static MakeCategory(raw_post) {
        if (raw_post?.mblog?.retweeted_status) {
            return "DYNAMIC_TYPE_FORWARD";
        }
        else if (raw_post?.mblog?.page_info && raw_post?.mblog?.page_info?.type === 'video') {
            return "DYNAMIC_TYPE_AV";
        }
        else if (raw_post?.mblog?.pics) {
            return "DYNAMIC_TYPE_DRAW";
        }
        else {
            return "DYNAMIC_TYPE_ARTICLE";
        }
    }
    static filterText(raw_text) {
        const text = raw_text.replace(/<br \/>/g, '\n');
        const dom = new JSDOM(text);
        return dom.window.document.body.textContent || '';
    }
    static async formatDynamicData(raw_post) {
        let info = raw_post?.mblog || raw_post;
        let retweeted = info && info?.retweeted_status ? true : false;
        let pic_num = retweeted ? info?.retweeted_status?.pic_num : info?.pic_num;
        let type = this.MakeCategory(raw_post);
        if (info?.isLongText || pic_num > 9) {
            const res = await fetch(`https://m.weibo.cn/detail/${info.mid}`, { headers: WeiboApi.WEIBO_HEADERS });
            try {
                const text = await res.text();
                const match = text.match(/"status": ([\s\S]+),\s+"call"/);
                if (match) {
                    const full_json_text = match[1];
                    info = JSON.parse(full_json_text);
                }
            }
            catch (err) {
                logger?.error(`优纪插件：微博 detail message error(https://m.weibo.cn/detail/${info?.mid})`);
            }
        }
        const face_url = info?.user?.profile_image_url;
        const nick_name = info?.user?.screen_name;
        let created_time = this.getDynamicCreatetDate(raw_post);
        let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;
        let pics = [];
        let formatData = { data: {} };
        formatData.data.face = face_url;
        formatData.data.name = nick_name;
        formatData.data.pendant = '';
        formatData.data.created = moment().format("YYYY年MM月DD日 HH:mm:ss");
        formatData.data.type = type;
        switch (type) {
            case "DYNAMIC_TYPE_AV":
                formatData.data.title = info?.page_info?.title || "";
                formatData.data.content = this.parseRichTextNodes(info?.text);
                formatData.data.url = detail_url;
                formatData.data.pubTs = moment(created_time).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.category = "视频动态";
                formatData.data.pics = info?.page_info?.page_pic?.url ? [{ url: info.page_info.page_pic.url }] : [];
                break;
            case "DYNAMIC_TYPE_DRAW":
                let raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
                pics = raw_pics_list.map((img) => { return { url: img?.large?.url, width: Number(img?.large?.geo?.width), height: Number(img?.large?.geo?.height) }; }) || [];
                formatData.data.title = "";
                formatData.data.content = this.parseRichTextNodes(info?.text);
                formatData.data.url = detail_url;
                formatData.data.pubTs = moment(created_time).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.pics = pics;
                formatData.data.category = "图文动态";
                break;
            case "DYNAMIC_TYPE_ARTICLE":
                let raw_pics_list_article = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
                pics = raw_pics_list_article.map((img) => { return { url: img?.large?.url, width: Number(img?.large?.geo?.width), height: Number(img?.large?.geo?.height) }; }) || [];
                formatData.data.title = "";
                formatData.data.content = this.parseRichTextNodes(info?.text);
                formatData.data.url = detail_url;
                formatData.data.pubTs = moment(created_time).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.pics = pics;
                formatData.data.category = "文章动态";
                break;
            case "DYNAMIC_TYPE_FORWARD":
                formatData.data.title = "";
                formatData.data.content = this.parseRichTextNodes(info?.text);
                formatData.data.pubTs = moment(created_time).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.url = detail_url;
                formatData.data.pics = [];
                let origin_post_info = info?.retweeted_status;
                formatData.data.orig = await this.formatDynamicData(origin_post_info);
                formatData.data.category = "转发动态";
                break;
        }
        return {
            ...formatData,
            uid: info?.id,
        };
    }
    ;
    static parseRichTextNodes = (nodes) => {
        if (typeof nodes === 'string') {
            let parsedContent = nodes.replace(/\n/g, '<br>');
            parsedContent = parsedContent.replace(/<a/g, () => {
                const randomKey = Math.random().toString(36).substring(7);
                return `<a key="${randomKey}"`;
            });
            parsedContent = parsedContent.replace(/class="url-icon"/g, () => {
                const randomKey = Math.random().toString(36).substring(7);
                return `class="url-icon ${randomKey}"`;
            });
            parsedContent = parsedContent.replace(/<img/g, () => {
                const randomKey = Math.random().toString(36).substring(7);
                return `<img key="${randomKey}"`;
            });
            return parsedContent;
        }
        else {
            return nodes;
        }
    };
    static async formatTextDynamicData(upName, raw_post, isForward, setData) {
        let msg = [], raw_pics_list, pic_urls, pics;
        let info = raw_post?.mblog || raw_post;
        let retweeted = info && info.retweeted_status ? true : false;
        let pic_num = retweeted ? info?.retweeted_status?.pic_num : info?.pic_num;
        let type = this.MakeCategory(raw_post);
        if (info?.isLongText || pic_num > 9) {
            const res = await fetch(`https://m.weibo.cn/detail/${info.mid}`, { headers: WeiboApi.WEIBO_HEADERS });
            try {
                const text = await res.text();
                const match = text.match(/"status": ([\s\S]+),\s+"call"/);
                if (match) {
                    const full_json_text = match[1];
                    info = JSON.parse(full_json_text);
                }
            }
            catch (err) {
                (logger ?? Bot.logger)?.mark(`优纪插件：获取微博动态全文出错：https://m.weibo.cn/detail/${info?.mid}`);
            }
        }
        let created_time = this.getDynamicCreatetDate(raw_post);
        let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;
        let title = `微博【${upName}】动态推送：\n`;
        const dynamicPicCountLimit = setData.pushPicCountLimit || 3;
        switch (type) {
            case "DYNAMIC_TYPE_AV":
                if (!info)
                    return;
                let cover_img_url = info?.page_info?.page_pic?.url;
                let cover_img = segment.image(cover_img_url, false, 15000, { referer: "https://weibo.com", });
                title = `微博【${upName}】视频动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `标题：${info?.page_info?.title || ""}\n`,
                    `${this.filterText(info?.text)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""}\n`,
                    cover_img,
                ];
                return msg;
            case "DYNAMIC_TYPE_DRAW":
                raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
                if (!info && !raw_pics_list)
                    return;
                if (raw_pics_list.length > dynamicPicCountLimit)
                    raw_pics_list.length = dynamicPicCountLimit;
                pic_urls = raw_pics_list.map((img) => img?.large?.url);
                pics = [];
                for (let pic_url of pic_urls) {
                    const temp = segment.image(pic_url, false, 15000, { referer: "https://weibo.com", });
                    pics.push(temp);
                }
                title = `微博【${upName}】图文动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(this.filterText(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""}\n`,
                    ...pics,
                ];
                return msg;
            case "DYNAMIC_TYPE_ARTICLE":
                if (!info)
                    return;
                raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
                if (raw_pics_list.length > dynamicPicCountLimit)
                    raw_pics_list.length = dynamicPicCountLimit;
                pic_urls = raw_pics_list.map(img => img?.large?.url);
                pics = [];
                for (const pic_url of pic_urls) {
                    const temp = segment.image(pic_url, false, 15000, { referer: "https://weibo.com", });
                    pics.push(temp);
                }
                title = `微博【${upName}】文章动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `正文：${this.dynamicContentLimit(this.filterText(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""}\n`,
                    ...pics,
                ];
                return msg;
            case "DYNAMIC_TYPE_FORWARD":
                if (!info)
                    return;
                if (!info?.retweeted_status)
                    return;
                const origin_post_info = info?.retweeted_status;
                isForward = true;
                let orig = await this.formatTextDynamicData(upName, origin_post_info, isForward, setData);
                if (orig && orig.length) {
                    orig = orig.slice(2);
                }
                else {
                    return false;
                }
                title = `微博【${upName}】转发动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(this.filterText(info?.text), setData)}\n`,
                    `链接：${detail_url}\n`,
                    `时间：${created_time
                        ? moment(created_time).format("YYYY年MM月DD日 HH:mm:ss")
                        : ""}\n`,
                    "\n---以下为转发内容---\n",
                    ...orig,
                ];
                return msg;
            default:
                logger?.mark(`未处理的微博推送【${upName}】：${type}`);
                return "continue";
        }
    }
    static dynamicContentLimit(content, setData) {
        const lines = content.split("\n");
        const lengthLimit = setData.pushContentLenLimit || 100;
        const lineLimit = setData.pushContentLineLimit || 5;
        if (lines.length > lineLimit) {
            lines.length = lineLimit;
        }
        let totalLength = 0;
        for (let i = 0; i < lines.length; i++) {
            const remainingLength = lengthLimit - totalLength;
            if (totalLength >= lengthLimit) {
                lines.splice(i--, 1);
                continue;
            }
            if (lines[i].length > remainingLength) {
                lines[i] = lines[i].slice(0, remainingLength) + "...";
                totalLength = lengthLimit;
            }
            else {
                totalLength += lines[i].length;
            }
        }
        return lines.join("\n");
    }
    static formatUrl(url) {
        return 0 == url.indexOf('//') ? `https:${url}` : url;
    }
    static typeHandle(up, msg, type) {
        const typeMap = {
            "直播": "DYNAMIC_TYPE_LIVE_RCMD",
            "转发": "DYNAMIC_TYPE_FORWARD",
            "文章": "DYNAMIC_TYPE_ARTICLE",
            "图文": ["DYNAMIC_TYPE_DRAW", "DYNAMIC_TYPE_WORD"],
            "视频": "DYNAMIC_TYPE_AV"
        };
        let newType = new Set(up.type || []);
        const handleType = (action) => {
            let isHandled = false;
            for (const [key, value] of Object.entries(typeMap)) {
                if (msg.indexOf(key) !== -1) {
                    if (Array.isArray(value)) {
                        value.forEach(v => action === "add" ? newType.add(v) : newType.delete(v));
                    }
                    else {
                        action === "add" ? newType.add(value) : newType.delete(value);
                    }
                    isHandled = true;
                }
            }
            return isHandled;
        };
        if (type === "add") {
            handleType("add");
        }
        else if (type === "del") {
            if (!newType.size) {
                newType = new Set(Object.values(typeMap).flat());
            }
            if (!handleType("delete")) {
                newType.clear();
            }
        }
        return Array.from(newType);
    }
}

export { WeiboQuery };
