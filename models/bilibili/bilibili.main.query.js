import moment from 'moment';
import { readSyncCookie, cookieWithBiliTicket } from './bilibili.main.models.js';
import BiliApi from './bilibili.main.api.js';
import axios from 'axios';
import lodash from 'lodash';

class BiliQuery {
    /**
     * 序列化动态数据
     * @param data - 动态数据对象
     * @returns 序列化后的动态数据对象
     */
    static async formatDynamicData(data) {
        const BiliDrawDynamicLinkUrl = 'https://m.bilibili.com/dynamic/';
        let desc, pics = [], majorType;
        let formatData = { data: {} };
        const author = data?.modules?.module_author || {};
        formatData.data.face = author.face; // 作者头像
        formatData.data.name = author.name; // 作者名字
        formatData.data.pendant = author?.pendant?.image || data?.pendant?.image; // 作者挂件
        formatData.data.created = moment().format('YYYY年MM月DD日 HH:mm:ss'); // 创建时间
        formatData.data.type = data.type; // 动态类型
        switch (data.type) {
            case 'DYNAMIC_TYPE_AV':
                desc = data?.modules?.module_dynamic?.major?.archive || {};
                formatData.data.title = desc?.title;
                formatData.data.content = this.parseRichTextNodes(desc?.desc);
                formatData.data.url = this.formatUrl(desc?.jump_url) || '';
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss');
                formatData.data.category = '视频动态';
                formatData.data.pics = [{ url: desc?.cover }];
                break;
            case 'DYNAMIC_TYPE_WORD':
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics =
                        pics.map((item) => {
                            return { url: item?.url, width: item?.width, height: item?.height };
                        }) || [];
                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc || {};
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = [];
                    formatData.data.content = this.parseRichTextNodes(desc?.text);
                }
                formatData.data.title = '';
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss');
                formatData.data.category = '图文动态';
                break;
            case 'DYNAMIC_TYPE_DRAW':
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => {
                        return { url: item?.url, width: item?.width, height: item?.height };
                    });
                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                }
                else if (majorType === 'MAJOR_TYPE_DRAW') {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => {
                        return { url: item?.url, width: item?.width, height: item?.height };
                    });
                    formatData.data.content = this.parseRichTextNodes(desc?.rich_text_nodes || desc?.text) || '';
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => {
                        return { url: item?.src };
                    });
                    formatData.data.content = this.parseRichTextNodes(desc?.text);
                }
                formatData.data.title = '';
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss');
                formatData.data.pics = pics;
                formatData.data.category = '图文动态';
                break;
            case 'DYNAMIC_TYPE_ARTICLE':
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics =
                        pics.map((item) => {
                            return { url: item?.url, width: item?.width, height: item?.height };
                        }) || [];
                    formatData.data.title = desc?.title;
                    // 文章内容过长，则尝试获取全文
                    if (desc?.summary?.text?.length >= 480) {
                        const fullArticleContent = await this.getFullArticleContent(this.formatUrl(desc?.jump_url));
                        if (fullArticleContent) {
                            const { readInfo, articleType } = fullArticleContent;
                            // 文章链接类型为 cv（旧类型） 或者 opus（新类型）
                            if (articleType === 'cv') {
                                formatData.data.content = this.praseFullOldTypeArticleContent(readInfo?.content);
                                if (String(formatData.data.content).length < 100) {
                                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                                    formatData.data.pics = pics;
                                }
                                else {
                                    formatData.data.pics = [];
                                }
                            }
                            else if (articleType === 'opus') {
                                const { content, img } = this.praseFullNewTypeArticleContent(readInfo?.paragraphs);
                                formatData.data.content = content;
                                formatData.data.pics = img && img.length > 0 ? img : pics;
                                if (content && content.length < 100) {
                                    formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                                }
                            }
                            else {
                                formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                                formatData.data.pics = pics;
                            }
                        }
                    }
                    else {
                        formatData.data.content = this.parseRichTextNodes(desc?.summary?.rich_text_nodes || desc?.summary?.text) || '';
                        formatData.data.pics = pics;
                    }
                }
                else if (majorType === 'MAJOR_TYPE_ARTICLE') {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    pics = desc?.covers;
                    pics = pics.map((item) => ({ url: item }));
                    formatData.data.title = desc?.title;
                    formatData.data.content = this.parseRichTextNodes(desc?.desc);
                }
                else {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    if (desc.covers && desc.covers.length) {
                        pics = [{ url: desc?.covers }];
                    }
                    formatData.data.title = desc?.title;
                    formatData.data.pics = pics;
                    formatData.data.content = '';
                }
                formatData.data.url = this.formatUrl(desc?.jump_url) || '';
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss');
                formatData.data.category = '文章动态';
                break;
            case 'DYNAMIC_TYPE_FORWARD':
                desc = data?.modules?.module_dynamic?.desc || {};
                formatData.data.title = '';
                formatData.data.content = this.parseRichTextNodes(desc?.rich_text_nodes) || this.parseRichTextNodes(desc?.text);
                formatData.data.pubTime = author.pub_time;
                formatData.data.pubTs = moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss');
                formatData.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
                formatData.data.pics = [data?.cover];
                formatData.data.orig = await this.formatDynamicData(data.orig);
                formatData.data.category = '转发动态';
                break;
            case 'DYNAMIC_TYPE_LIVE_RCMD':
                desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
                if (!desc)
                    break;
                desc = JSON.parse(desc);
                desc = desc?.live_play_info;
                if (!desc)
                    break;
                formatData.data.title = desc?.title;
                formatData.data.content = '';
                formatData.data.pubTime = '';
                formatData.data.pubTs = '';
                formatData.data.url = `https:${desc.link}`;
                formatData.data.pics = [{ url: desc?.cover }];
                formatData.data.category = '直播动态';
                break;
        }
        return {
            ...formatData,
            uid: data?.id_str // 用户ID
        };
    }
    /**
     * 动态内容富文本节点解析
     * @param nodes - 动态内容富文本节点
     * @returns 解析后的动态内容富文本
     */
    static parseRichTextNodes = (nodes) => {
        if (typeof nodes === 'string') {
            // 将\t 替换为&nbsp;实现空格，\n 替换为 <br> 以实现换行
            nodes = nodes.replace(/\t/g, '&nbsp;');
            return nodes.replace(/\n/g, '<br>');
        }
        else if (Array.isArray(nodes)) {
            return nodes
                .map((node) => {
                switch (node.type) {
                    case 'RICH_TEXT_NODE_TYPE_TOPIC':
                        // 确保链接以 https:// 开头
                        let jumpUrl = node?.jump_url;
                        if (jumpUrl && !jumpUrl.startsWith('http://') && !jumpUrl.startsWith('https://')) {
                            jumpUrl = `https://${jumpUrl}`;
                        }
                        return `<span class="bili-rich-text-module topic" href="${jumpUrl}">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_TEXT':
                        // 正文将 \n 替换为 <br> 以实现换行
                        return node.text.replace(/\n/g, '<br>') || '';
                    case 'RICH_TEXT_NODE_TYPE_AT':
                        // 处理 @ 类型，使用官方的HTML标签写法
                        return `<span data-module="desc" data-type="at" data-oid="${node?.rid}" class="bili-rich-text-module at">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_LOTTERY':
                        // 处理互动抽奖类型，使用官方的HTML标签写法
                        return `<span data-module="desc" data-type="lottery" data-oid="${node?.rid}" class="bili-rich-text-module lottery">${node?.text}</span>`;
                    case 'RICH_TEXT_NODE_TYPE_WEB':
                        // 处理 RICH_TEXT_NODE_TYPE_WEB 类型，直接拼接 text 属性
                        return node.text;
                    case 'RICH_TEXT_NODE_TYPE_EMOJI':
                        // 处理表情类型，使用 img 标签显示表情
                        const emoji = node.emoji;
                        return `<img src="${emoji?.icon_url}" alt="${emoji?.text}" title="${emoji?.text}" style="vertical-align: middle; width: ${emoji?.size}em; height: ${emoji?.size}em;">`;
                    case 'RICH_TEXT_NODE_TYPE_GOODS':
                        // 处理商品推广类型，使用官方的HTML标签写法
                        const goods_url = node?.jump_url;
                        return `<span data-module="desc" data-type="goods" data-url="${goods_url}" data-oid="${node?.rid}" class="bili-rich-text-module goods ${node?.icon_name}">&ZeroWidthSpace;${node?.text}</span>`;
                    default:
                        return node;
                }
            })
                .join('');
        }
        else {
            // 未知类型，直接返回
            return nodes;
        }
    };
    /**获取完整B站文章内容
     * @param postUrl - 文章链接: https://www.bilibili.com/read/cvxxxx 或者 https://www.bilibili.com/opus/xxxx
     * @returns {JSON} 完整的B站文章内容json数据
     */
    static async getFullArticleContent(postUrl) {
        let { cookie } = await readSyncCookie();
        cookie = await cookieWithBiliTicket(cookie);
        try {
            const response = await axios.get(postUrl, {
                headers: lodash.merge(BiliApi.BILIBILI_ARTICLE_HEADERS, { Cookie: `${cookie}`, Host: 'www.bilibili.com' }),
                responseType: 'text'
            });
            const text = response.data;
            let match, readInfo, articleType;
            if (/^https:\/\/www.bilibili.com\/read\/cv/.test(postUrl)) {
                match = String(text).match(/"readInfo":([\s\S]+?),"readViewInfo":/);
                if (match) {
                    const full_json_text = match[1];
                    readInfo = JSON.parse(full_json_text);
                    articleType = 'cv';
                    return { readInfo, articleType };
                }
            }
            else if (/^https:\/\/www.bilibili.com\/opus\//.test(postUrl)) {
                match = String(text).match(/"module_content":([\s\S]+?),\s*"module_type":"MODULE_TYPE_CONTENT"/);
                if (match) {
                    const full_json_text = match[1];
                    readInfo = JSON.parse(full_json_text);
                    articleType = 'opus';
                    return { readInfo, articleType };
                }
            }
        }
        catch (err) {
            logger?.error(`优纪插件：获取B站完整文章内容失败 [ ${postUrl} ] : ${err}`);
            return { readInfo: null, articleType: null };
        }
    }
    /**解析旧版完整文章内容 */
    static praseFullOldTypeArticleContent(content) {
        content = String(content).replace(/\n/g, '<br>');
        // 使用正则表达式匹配 <img> 标签的 data-src 属性
        const imgTagRegex = /<img[^>]*data-src="([^"]*)"[^>]*>/g;
        // 替换 data-src 为 src，并将 // 开头的链接改为 https:// 开头
        content = content.replace(imgTagRegex, (match, p1) => {
            const newSrc = this.formatUrl(p1);
            return match.replace('data-src', 'src').replace(p1, newSrc);
        });
        return content;
    }
    /**
     * 解析新版完整文章内容，将其转换为HTML格式的正文和图片数组。
     * 该方法处理的是 MODULE_TYPE_CONTENT 类型的文章，文章内容由多个段落组成。
     * 每个段落可能包含不同类型的内容，如正文、图片、链接、表情等。
     *
     * @param paragraphs - MODULE_TYPE_CONTENT 类型文章的段落数组，每个段落是一个对象。
     *                     每个段落对象包含一个 para_type 属性，用于标识段落类型（1表示正文，2表示图片）。
     *                     正文段落中可能包含多个 nodes，每个 node 表示一段文本或一个富文本元素。
     *                     图片段落中包含一个 pic 对象，其中 pics 是图片信息的数组。
     * @returns 返回一个对象，包含两个属性：
     *          - content: string 类型，解析后的HTML格式的正文字符串。
     *          - img: array 类型，包含图片信息的对象数组，每个对象有 url、width 和 height 属性。
     *          如果输入的 paragraphs 不是数组，则返回 null。
     */
    static praseFullNewTypeArticleContent = (paragraphs) => {
        if (Array.isArray(paragraphs)) {
            // 筛选出正文和图片
            paragraphs = paragraphs.filter(paragraph => paragraph.para_type === 1 || paragraph.para_type === 2);
            let content = '';
            let img = [];
            paragraphs.forEach((item) => {
                switch (item.para_type) {
                    case 1:
                        // 处理正文
                        if (item.text?.nodes) {
                            content += item.text.nodes
                                .map((node) => {
                                let nodeType = node.type;
                                if (nodeType === 'TEXT_NODE_TYPE_RICH') {
                                    let richType = node?.rich?.type;
                                    switch (richType) {
                                        case 'RICH_TEXT_NODE_TYPE_TOPIC':
                                            // 确保链接以 https:// 开头
                                            let jumpUrl = node?.rich?.jump_url;
                                            if (jumpUrl && !jumpUrl.startsWith('http://') && !jumpUrl.startsWith('https://')) {
                                                jumpUrl = `https://${jumpUrl}`;
                                            }
                                            return `<span class="bili-rich-text-module topic" href="${jumpUrl}">${node?.rich?.text}</span>`;
                                        case 'RICH_TEXT_NODE_TYPE_TEXT':
                                            // 正文将 \n 替换为 <br> 以实现换行
                                            return node?.rich?.text.replace(/\n/g, '<br>');
                                        case 'RICH_TEXT_NODE_TYPE_AT':
                                            // 处理 @ 类型，使用官方的HTML标签写法
                                            return `<span data-module="desc" data-type="at" data-oid="${node?.rich?.rid}" class="bili-rich-text-module at">${node?.rich?.text}</span>`;
                                        case 'RICH_TEXT_NODE_TYPE_LOTTERY':
                                            // 处理互动抽奖类型，使用官方的HTML标签写法
                                            return `<span data-module="desc" data-type="lottery" data-oid="${node?.rich?.rid}" class="bili-rich-text-module lottery">${node?.rich?.text}</span>`;
                                        case 'RICH_TEXT_NODE_TYPE_WEB':
                                            // 处理 RICH_TEXT_NODE_TYPE_WEB 类型，直接拼接 text 属性
                                            return node?.rich?.text;
                                        case 'RICH_TEXT_NODE_TYPE_EMOJI':
                                            // 处理表情类型，使用 img 标签显示表情
                                            const emoji = node?.rich?.emoji;
                                            return `<img src="${emoji?.icon_url}" alt="${emoji?.text}" title="${emoji?.text}" style="vertical-align: middle; width: ${emoji?.size}em; height: ${emoji?.size}em;">`;
                                        case 'RICH_TEXT_NODE_TYPE_GOODS':
                                            // 处理商品推广类型，使用官方的HTML标签写法
                                            const goods_url = node?.rich?.jump_url;
                                            return `<span data-module="desc" data-type="goods" data-url="${goods_url}" data-oid="${node?.rich?.rid}" class="bili-rich-text-module goods ${node?.rich?.icon_name}">&ZeroWidthSpace;${node?.rich?.text}</span>`;
                                        default:
                                            return node;
                                    }
                                }
                                else if (nodeType === 'TEXT_NODE_TYPE_WORD') {
                                    return `${node?.word?.words}<br>`;
                                }
                            })
                                .join('');
                        }
                        break;
                    case 2:
                        // 处理图片
                        if (item?.pic?.pics) {
                            img = img.concat(item?.pic?.pics.map((item) => {
                                return { url: item?.url, width: item?.width, height: item?.height };
                            }) || []);
                        }
                        break;
                }
            });
            return { content, img };
        }
        else {
            // 未知类型，返回null
            return null;
        }
    };
    // 处理斜杠开头的链接
    static formatUrl(url) {
        return 0 == url.indexOf('//') ? `https:${url}` : url;
    }
    /**
     * 生成动态消息文字内容
     * @param upName - UP主名称
     * @param formatData - 动态数据
     * @param isForward - 是否为转发动态
     * @param setData - 设置数据
     * @returns 生成的动态消息文字内容
     */
    static async formatTextDynamicData(upName, data, isForward, setData) {
        const BiliDrawDynamicLinkUrl = 'https://m.bilibili.com/dynamic/';
        let desc, msg = [], pics = [], author, majorType, content, dynamicTitle;
        let title = `B站【${upName}】动态推送：\n`;
        let dynamicType = data.type;
        switch (dynamicType) {
            case 'DYNAMIC_TYPE_AV':
                // 处理视频动态
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
                    `时间：${author ? moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss') : ''}`
                ];
                pics = [segment.image(desc?.cover)];
                return { msg, pics, dynamicType };
            case 'DYNAMIC_TYPE_WORD':
                // 处理文字动态
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics =
                        pics.map((item) => {
                            return item?.url;
                        }) || [];
                    content = desc?.summary?.text || '';
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
                    `时间：${author ? moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss') : ''}`
                ];
                return { msg, pics, dynamicType };
            case 'DYNAMIC_TYPE_DRAW':
                // 处理图文动态
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics = pics.map((item) => {
                        return item.url;
                    });
                    content = desc?.summary?.text || '';
                }
                else if (majorType === 'MAJOR_TYPE_DRAW') {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => {
                        return item?.src;
                    });
                    content = desc?.text || '';
                }
                else {
                    desc = data?.modules?.module_dynamic?.desc;
                    pics = data?.modules?.module_dynamic?.major?.draw?.items;
                    pics = pics.map((item) => {
                        return item?.src;
                    });
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
                    `时间：${author ? moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss') : ''}`
                ];
                return { msg, pics, dynamicType };
            case 'DYNAMIC_TYPE_ARTICLE':
                // 处理文章动态
                author = data?.modules?.module_author;
                majorType = data?.modules?.module_dynamic?.major?.type;
                if (majorType === 'MAJOR_TYPE_OPUS') {
                    desc = data?.modules?.module_dynamic?.major?.opus || {};
                    pics = desc?.pics;
                    pics =
                        pics.map((item) => {
                            return item.url;
                        }) || [];
                    dynamicTitle = desc?.title;
                    content = desc?.summary?.text || '';
                }
                else if (majorType === 'MAJOR_TYPE_ARTICLE') {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    pics = desc?.covers || [];
                    dynamicTitle = desc?.title;
                    content = desc?.desc;
                }
                else {
                    desc = data?.modules?.module_dynamic?.major?.article || {};
                    if (desc.covers && desc.covers.length) {
                        pics = [desc?.covers];
                    }
                    dynamicTitle = desc?.title;
                    pics = pics;
                    content = '';
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
                    `时间：${author ? moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss') : ''}`
                ];
                return { msg, pics, dynamicType };
            case 'DYNAMIC_TYPE_FORWARD':
                // 处理转发动态
                author = data?.modules?.module_author;
                desc = data?.modules?.module_dynamic?.desc || {};
                content = desc?.text;
                if (!desc && !author)
                    return;
                if (!data.orig)
                    return;
                isForward = true;
                let orig = await this.formatTextDynamicData(upName, data.orig, isForward, setData);
                let origContent = [];
                if (orig && typeof orig === 'object') {
                    origContent = orig.msg.slice(2);
                    pics = orig.pics;
                }
                else {
                    return 'continue';
                }
                title = `B站【${upName}】转发动态推送：\n`;
                msg = [
                    title,
                    `-----------------------------\n`,
                    `${this.dynamicContentLimit(content, setData)}\n`,
                    `链接：${BiliDrawDynamicLinkUrl}${data.id_str}\n`,
                    `时间：${author ? moment(author.pub_ts * 1000).format('YYYY年MM月DD日 HH:mm:ss') : ''}\n`,
                    '\n---以下为转发内容---\n',
                    ...origContent
                ];
                return { msg, pics, dynamicType };
            case 'DYNAMIC_TYPE_LIVE_RCMD':
                // 处理直播动态
                desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
                if (!desc)
                    return;
                desc = JSON.parse(desc);
                desc = desc?.live_play_info;
                if (!desc)
                    return;
                title = `B站【${upName}】直播动态推送：\n`;
                msg = [title, `-----------------------------\n`, `标题：${desc.title}\n`, `链接：https:${desc.link}`];
                pics = [segment.image(desc.cover)];
                return { msg, pics, dynamicType };
            default:
                // 处理未定义的动态类型
                (Bot.logger ?? logger)?.mark(`未处理的B站推送【${upName}】：${data.type}`);
                return 'continue';
        }
    }
    // 限制文字模式下动态内容的字数和行数
    static dynamicContentLimit(content, setData) {
        const lines = content.split('\n');
        const lengthLimit = setData.pushContentLenLimit || 100;
        const lineLimit = setData.pushContentLineLimit || 5;
        // 限制行数
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
                lines[i] = lines[i].slice(0, remainingLength) + '...';
                totalLength = lengthLimit;
            }
            else {
                totalLength += lines[i].length;
            }
        }
        return lines.join('\n');
    }
    /**根据关键字更新 up 的动态类型 */
    static typeHandle(up, msg, type) {
        // 定义一个对象映射，将关键字映射到对应的类型
        const typeMap = {
            直播: 'DYNAMIC_TYPE_LIVE_RCMD',
            转发: 'DYNAMIC_TYPE_FORWARD',
            文章: 'DYNAMIC_TYPE_ARTICLE',
            图文: ['DYNAMIC_TYPE_DRAW', 'DYNAMIC_TYPE_WORD'],
            视频: 'DYNAMIC_TYPE_AV'
        };
        // 初始化新的类型集合，如果 up.type 存在则使用它，否则使用空数组
        let newType = new Set(up.type || []);
        // 定义一个处理类型的函数，根据传入的 action 参数决定是添加还是删除类型
        const handleType = (action) => {
            let isHandled = false; // 标记是否有类型被处理
            // 遍历 typeMap 对象，根据 msg 中的关键字进行类型操作
            for (const [key, value] of Object.entries(typeMap)) {
                if (msg.indexOf(key) !== -1) {
                    if (Array.isArray(value)) {
                        // 如果 value 是数组，则对数组中的每个元素进行操作
                        value.forEach(v => (action === 'add' ? newType.add(v) : newType.delete(v)));
                    }
                    else {
                        // 否则直接对单个值进行操作
                        action === 'add' ? newType.add(value) : newType.delete(value);
                    }
                    isHandled = true; // 标记有类型被处理
                }
            }
            return isHandled; // 返回是否有类型被处理
        };
        // 根据 type 参数决定是添加还是删除类型
        if (type === 'add') {
            handleType('add'); // 调用 handleType 函数进行类型添加
        }
        else if (type === 'del') {
            if (!newType.size) {
                // 如果 newType 为空，则初始化它为所有可能的类型
                newType = new Set(Object.values(typeMap).flat());
            }
            // 调用 handleType 函数进行类型删除，如果没有类型被删除则清空 newType
            if (!handleType('delete')) {
                newType.clear();
            }
        }
        // 将 newType 转换为数组并返回
        return Array.from(newType);
    }
}

export { BiliQuery };
