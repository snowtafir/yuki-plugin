import moment from 'moment';
import { readSyncCookie } from './bilibili.models.js';
import { BiliApi } from './bilibili.api.js';
import axios from 'axios';
import lodash from 'lodash';

class BiliQuery {
    static async formatDynamicData(data) {
        const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
        let desc, pics = [], majorType;
        let formatData = { data: {} };
        const author = data?.modules?.module_author || {};
        formatData.data.face = author.face;
        formatData.data.name = author.name;
        formatData.data.pendant = author?.pendant?.image || data?.pendant?.image;
        formatData.data.created = moment().format("YYYY年MM月DD日 HH:mm:ss");
        formatData.data.type = data.type;
        switch (data.type) {
            case "DYNAMIC_TYPE_AV":
                desc = data?.modules?.module_dynamic?.major?.archive || {};
                formatData.data.title = desc?.title;
                formatData.data.content = this.parseRichTextNodes(desc?.desc);
                formatData.data.url = this.formatUrl(desc?.jump_url);
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.category = "视频动态";
                formatData.data.pics = [{ url: desc?.cover }];
                break;
            case "DYNAMIC_TYPE_WORD":
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => { return { url: item?.url, width: item?.width, height: item?.height }; }) || [];
                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || "";
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc || {};
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = [];
                    formatData.data.content = this.parseRichTextNodes(desc?.text);
                }
                formatData.data.title = "";
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.category = "图文动态";
                break;
            case "DYNAMIC_TYPE_DRAW":
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => { return { url: item?.url, width: item?.width, height: item?.height }; });
                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || "";
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => { return { url: item?.src }; });
                    formatData.data.content = this.parseRichTextNodes(desc?.text);
                }
                formatData.data.title = "";
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.pics = pics;
                formatData.data.category = "图文动态";
                break;
            case "DYNAMIC_TYPE_ARTICLE":
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => { return { url: item?.url, width: item?.width, height: item?.height }; }) || [];
                    formatData.data.title = desc?.title;
                    if ((desc?.summary?.text)?.length >= 480) {
                        const readInfo = await this.getFullArticleContent(this.formatUrl(desc?.jump_url));
                        formatData.data.content = this.praseFullArticleContent(readInfo?.content);
                        formatData.data.pics = [];
                        if ((formatData.data.content) === null) {
                            formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || "";
                            formatData.data.pics = pics;
                        }
                    }
                    else {
                        formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || "";
                        formatData.data.pics = pics;
                    }
                }
                else {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    if (desc.covers && desc.covers.length) {
                        pics = [{ url: desc?.covers }];
                    }
                    formatData.data.title = desc?.title;
                    formatData.data.pics = pics;
                    formatData.data.content = "";
                }
                formatData.data.url = this.formatUrl(desc?.jump_url);
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.category = "文章动态";
                break;
            case "DYNAMIC_TYPE_FORWARD":
                desc = data?.modules?.module_dynamic?.desc || {};
                formatData.data.title = "";
                formatData.data.content = this.parseRichTextNodes(desc?.rich_text_nodes) || this.parseRichTextNodes(desc?.text);
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss");
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pics = [data?.cover];
                formatData.data.orig = await this.formatDynamicData(data.orig);
                formatData.data.category = "转发动态";
                break;
            case "DYNAMIC_TYPE_LIVE_RCMD":
                desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
                if (!desc)
                    break;
                desc = JSON.parse(desc);
                desc = desc?.live_play_info;
                if (!desc)
                    break;
                formatData.data.title = desc?.title;
                formatData.data.content = "";
                formatData.data.pubTime = "";
                formatData.data.pubTs = "";
                formatData.data.url = `https:${desc.link}`;
                formatData.data.pics = [{ url: desc?.cover }];
                formatData.data.category = "直播动态";
                break;
        }
        return {
            ...formatData,
            uid: data?.id_str,
        };
    }
    ;
    static parseRichTextNodes = (nodes) => {
        if (typeof nodes === 'string') {
            return nodes.replace(/\n/g, '<br>');
        }
        else if (Array.isArray(nodes)) {
            return nodes.map((node) => {
                switch (node.type) {
                    case 'RICH_TEXT_NODE_TYPE_TOPIC':
                        let jumpUrl = node?.jump_url;
                        if (jumpUrl && !jumpUrl.startsWith('http://') && !jumpUrl.startsWith('https://')) {
                            jumpUrl = `https://${jumpUrl}`;
                        }
                        return `<span class="bili-rich-text-module topic" href="${jumpUrl}">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_TEXT':
                        return node.text.replace(/\n/g, '<br>');
                    case 'RICH_TEXT_NODE_TYPE_AT':
                        return `<span data-module="desc" data-type="at" data-oid="${node?.rid}" class="bili-rich-text-module at">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_LOTTERY':
                        return `<span data-module="desc" data-type="lottery" data-oid="${node?.rid}" class="bili-rich-text-module lottery">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_WEB':
                        return node.text;
                    case 'RICH_TEXT_NODE_TYPE_EMOJI':
                        const emoji = node.emoji;
                        return `<img src="${emoji?.icon_url}" alt="${emoji?.text}" title="${emoji?.text}" style="vertical-align: middle; width: ${emoji?.size}em; height: ${emoji?.size}em;">`;
                    case 'RICH_TEXT_NODE_TYPE_GOODS':
                        const goods_url = node?.jump_url;
                        return `<span data-module="desc" data-type="goods" data-url="${goods_url}" data-oid="${node?.rid}" class="bili-rich-text-module goods ${node?.icon_name}">&ZeroWidthSpace;${node?.text}</span>`;
                    default:
                        return node;
                }
            }).join('');
        }
        else {
            return nodes;
        }
    };
    static async getFullArticleContent(postUrl) {
        const Cookie = await readSyncCookie();
        try {
            const response = await axios.get(postUrl, {
                headers: lodash.merge(BiliApi.BILIBILI_ARTICLE_HEADERS, { "Cookie": `${Cookie}`, "Host": "www.bilibili.com" }),
                responseType: 'text'
            });
            const text = response.data;
            const match = text.match(/"readInfo":([\s\S]+?),"readViewInfo":/);
            if (match) {
                const full_json_text = match[1];
                const readInfo = JSON.parse(full_json_text);
                return readInfo;
            }
        }
        catch (err) {
            logger?.error(`优纪插件：获取B站完整文章内容失败 [ ${postUrl} ] : ${err}`);
            return null;
        }
    }
    static praseFullArticleContent(content) {
        content = content.replace(/\n/g, '<br>');
        const imgTagRegex = /<img[^>]*data-src="([^"]*)"[^>]*>/g;
        content = content.replace(imgTagRegex, (match, p1) => {
            const newSrc = this.formatUrl(p1);
            return match.replace('data-src', 'src').replace(p1, newSrc);
        });
        return content;
    }
    static formatUrl(url) {
        return 0 == url.indexOf('//') ? `https:${url}` : url;
    }
    static async formatTextDynamicData(upName, data, isForward, setData) {
        const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
        let desc, msg, pics, author, majorType, content, dynamicTitle;
        let title = `B站【${upName}】动态推送：\n`;
        switch (data.type) {
            case "DYNAMIC_TYPE_AV":
                desc = data?.modules?.module_dynamic?.major?.archive;
                author = data?.modules?.module_author;
                if (!desc && !author)
                    return;
                title = `B站【${upName}】视频动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `标题：${desc.title}\n`,
                    `${desc.desc}\n`,
                    `链接：${this.formatUrl(desc.jump_url)}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss") : ""}\n`,
                    segment.image(desc?.cover),
                ];
                return msg;
            case "DYNAMIC_TYPE_WORD":
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => { return item?.url; }) || [];
                    content = desc?.summary?.text || "";
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc || {};
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = [];
                    content = desc?.text;
                }
                if (!desc && !author)
                    return;
                title = `B站【${upName}】动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `内容：${this.dynamicContentLimit(content, setData)}\n`,
                    `链接：${BiliDrawDynamicLinkUrl}${data.id_str}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss") : ""}`,
                ];
                return msg;
            case "DYNAMIC_TYPE_DRAW":
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => {
                        return item.url;
                    });
                    content = desc?.summary?.text || "";
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => { return item?.src; });
                    content = desc?.text;
                }
                if (!desc && !pics && !author)
                    return;
                const dynamicPicCountLimit = setData.pushPicCountLimit || 3;
                if (pics.length > dynamicPicCountLimit) {
                    pics.length = dynamicPicCountLimit;
                }
                pics = pics.map((item) => {
                    return segment.image(item);
                });
                title = `B站【${upName}】图文动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(content, setData)}\n`,
                    `链接：${BiliDrawDynamicLinkUrl}${data.id_str}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss") : ""}\n`,
                    ...pics,
                ];
                return msg;
            case "DYNAMIC_TYPE_ARTICLE":
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === "MAJOR_TYPE_OPUS") {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => { return item.url; }) || [];
                    dynamicTitle = desc?.title;
                    content = desc?.summary?.text || "";
                }
                else {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    if (desc.covers && desc.covers.length) {
                        pics = [desc?.covers];
                    }
                    dynamicTitle = desc?.title;
                    pics = pics;
                    content = "";
                }
                if (!desc && !author)
                    return;
                pics = pics.map((item) => {
                    return segment.image(item);
                });
                title = `B站【${upName}】文章动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `标题：${dynamicTitle}\n`,
                    `链接：${this.formatUrl(desc.jump_url)}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss") : ""}\n`,
                    ...pics,
                ];
                return msg;
            case "DYNAMIC_TYPE_FORWARD":
                author = data?.modules?.module_author;
                desc = data?.modules?.module_dynamic?.desc || {};
                content = desc?.text;
                if (!desc && !author)
                    return;
                if (!data.orig)
                    return;
                isForward = true;
                let orig = await this.formatTextDynamicData(upName, data.orig, isForward, setData);
                if (orig && orig.length) {
                    orig = orig.slice(2);
                }
                else {
                    return false;
                }
                title = `B站【${upName}】转发动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(content, setData)}\n`,
                    `链接：${BiliDrawDynamicLinkUrl}${data.id_str}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss") : ""}\n`,
                    "\n---以下为转发内容---\n",
                    ...orig,
                ];
                return msg;
            case "DYNAMIC_TYPE_LIVE_RCMD":
                desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
                if (!desc)
                    return;
                desc = JSON.parse(desc);
                desc = desc?.live_play_info;
                if (!desc)
                    return;
                title = `B站【${upName}】直播动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `标题：${desc.title}\n`,
                    `链接：https:${desc.link}\n`,
                    segment.image(desc.cover),
                ];
                return msg;
            default:
                (Bot.logger ?? logger)?.mark(`未处理的B站推送【${upName}】：${data.type}`);
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

export { BiliQuery };
