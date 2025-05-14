import moment from 'moment';
import fetch from 'node-fetch';
import WeiboApi from '@/models/weibo/weibo.main.api';
import { JSDOM } from 'jsdom';

declare const Bot: any, segment: any;

declare const logger: any;

export class WeiboQuery {
  /**获取文章id */
  static getDynamicId(post: any) {
    return post?.mblog?.mid || post?.mblog?.id;
  }

  /**获取指定动态类型的原始数据 */
  static filterCardTypeCustom(raw_post: any) {
    return raw_post.card_type === 9;
  }

  /**转换微博动态创建时间：（created_at）转换为 UNIX 时间戳（以毫秒为单位） */
  static getDynamicCreatetDate(raw_post: any) {
    const created_time = Date.parse(raw_post?.mblog?.created_at || raw_post?.created_at);
    return created_time;
  }

  /**分类动态，返回标识 */
  static MakeCategory(raw_post: any) {
    if (raw_post?.mblog?.retweeted_status) {
      return 'DYNAMIC_TYPE_FORWARD';
    } else if (raw_post?.mblog?.page_info && raw_post?.mblog?.page_info?.type === 'video') {
      return 'DYNAMIC_TYPE_AV';
    } else if (raw_post?.mblog?.pics) {
      return 'DYNAMIC_TYPE_DRAW';
    } else if (!raw_post?.mblog?.pics && String(raw_post?.mblog?.text).trim().length > 0) {
      return 'DYNAMIC_TYPE_ARTICLE';
    } else {
      return 'DYNAMIC_TYPE_UNKNOWN';
    }
  }

  /**筛选正文 */
  static filterText(raw_text: string): string {
    const text = raw_text.replace(/<br \/>/g, '\n');
    const dom = new JSDOM(text);
    return dom.window.document.body.textContent || '';
  }

  /** 获取并生成微博动态渲染数据 */
  static async formatDynamicData(raw_post: any) {
    /* 初始数据进一步处理 **************** */
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
      } catch (err) {
        logger?.error(`优纪插件：微博 detail message error(https://m.weibo.cn/detail/${info?.mid})`);
      }
    }

    /**头像链接 */
    const face_url = info?.user?.profile_image_url;
    /**昵称 */
    const nick_name = info?.user?.screen_name;
    /**动态发布时间 */
    let created_time = this.getDynamicCreatetDate(raw_post);
    /**动态详情链接 */
    let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;

    /* 构造动态渲染数据 *************************** */
    let pics: any = [],
      video_pics_list: any[];
    let formatData: { data: { [key: string]: any } } = { data: {} };

    /**头像 */
    formatData.data.face = face_url;
    /**昵称 */
    formatData.data.name = nick_name;

    /**头像框 */
    formatData.data.pendant = '';
    /**生成日期 */
    formatData.data.created = moment().format('YYYY年MM月DD日 HH:mm:ss');

    formatData.data.type = type;
    switch (type) {
      case 'DYNAMIC_TYPE_AV':
        video_pics_list = info?.pics ? info?.pics : info?.page_info?.page_pic?.url ? [{ large: { url: info.page_info.page_pic.url } }] : [];
        pics =
          video_pics_list.map((img: any) => {
            return { url: img?.large?.url, width: Number(img?.large?.geo?.width), height: Number(img?.large?.geo?.height) };
          }) || [];
        formatData.data.title = info?.page_info?.title || '';
        formatData.data.content = this.parseRichTextNodes(info?.text);
        formatData.data.url = detail_url;
        formatData.data.pubTs = moment(created_time).format('YYYY年MM月DD日 HH:mm:ss');
        formatData.data.category = '视频动态';
        formatData.data.pics = pics;
        break;
      case 'DYNAMIC_TYPE_DRAW':
        let raw_pics_list: any[] = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
        pics =
          raw_pics_list.map((img: any) => {
            return { url: img?.large?.url, width: Number(img?.large?.geo?.width), height: Number(img?.large?.geo?.height) };
          }) || [];
        formatData.data.title = '';
        formatData.data.content = this.parseRichTextNodes(info?.text);
        formatData.data.url = detail_url;
        formatData.data.pubTs = moment(created_time).format('YYYY年MM月DD日 HH:mm:ss');
        formatData.data.pics = pics;
        formatData.data.category = '图文动态';
        break;
      case 'DYNAMIC_TYPE_ARTICLE':
        let raw_pics_list_article = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];
        pics =
          raw_pics_list_article.map((img: any) => {
            return { url: img?.large?.url, width: Number(img?.large?.geo?.width), height: Number(img?.large?.geo?.height) };
          }) || [];
        formatData.data.title = '';
        formatData.data.content = this.parseRichTextNodes(info?.text);
        formatData.data.url = detail_url;
        formatData.data.pubTs = moment(created_time).format('YYYY年MM月DD日 HH:mm:ss');
        formatData.data.pics = pics;
        formatData.data.category = '文章动态';
        break;
      case 'DYNAMIC_TYPE_FORWARD':
        formatData.data.title = '';
        formatData.data.content = this.parseRichTextNodes(info?.text);
        formatData.data.pubTs = moment(created_time).format('YYYY年MM月DD日 HH:mm:ss');
        formatData.data.url = detail_url;
        formatData.data.pics = [];
        let origin_post_info = info?.retweeted_status;
        formatData.data.orig = await this.formatDynamicData(origin_post_info);
        formatData.data.category = '转发动态';
        break;
      default:
        break;
    }

    return {
      ...formatData,
      uid: info?.id
    };
  }

  /**
   * 动态内容富文本节点解析
   * @param nodes - 动态内容富文本节点
   * @returns 解析后的动态内容富文本
   */
  static parseRichTextNodes = (nodes: any[] | string | any) => {
    if (typeof nodes === 'string') {
      // 将 \n 替换为 <br> 以实现换行
      let parsedContent = nodes.replace(/\n/g, '<br>');

      // 使用正则表达式查找所有的 <a> 标签
      parsedContent = parsedContent.replace(/<a/g, () => {
        // 生成一个随机的 key 值
        const randomKey = Math.random().toString(36).substring(7);
        return `<a key="${randomKey}"`;
      });

      parsedContent = parsedContent.replace(/class="url-icon"/g, () => {
        // 生成一个随机的 key 值
        const randomKey = Math.random().toString(36).substring(7);
        return `class="url-icon ${randomKey}"`;
      });

      // 使用正则表达式查找所有的 <img> 标签
      parsedContent = parsedContent.replace(/<img/g, () => {
        // 生成一个随机的 key 值
        const randomKey = Math.random().toString(36).substring(7);
        return `<img key="${randomKey}"`;
      });

      return parsedContent;
    } else {
      // 未知类型，直接返回
      return nodes;
    }
  };

  /**
   * 生成动态消息文字内容
   * @param upName - UP主名称
   * @param formatData - 动态数据
   * @param isForward - 是否为转发动态
   * @param setData - 设置数据
   * @returns 生成的动态消息文字内容
   */
  static async formatTextDynamicData(upName: string, raw_post: any, isForward?: boolean, setData?: any) {
    let msg: any[] = [],
      /**全部图片资源链接*/
      raw_pics_list: any[] = [],
      /**图片高清资源链接*/
      pic_urls: string[] = [],
      /**图片*/
      pics: any[] = [],
      video_pics_list: any[];

    let info = raw_post?.mblog || raw_post;
    let retweeted = info && info.retweeted_status ? true : false; //是否为转发动态
    let pic_num = retweeted ? info?.retweeted_status?.pic_num : info?.pic_num;
    let dynamicType = this.MakeCategory(raw_post);

    /**获取动态全文 */
    if (info?.isLongText || pic_num > 9) {
      const res = await fetch(`https://m.weibo.cn/detail/${info.mid}`, { headers: WeiboApi.WEIBO_HEADERS });
      try {
        const text = await res.text();
        const match = text.match(/"status": ([\s\S]+),\s+"call"/);
        if (match) {
          const full_json_text = match[1];
          info = JSON.parse(full_json_text);
        }
      } catch (err) {
        global?.logger?.mark(`优纪插件：获取微博动态全文出错：https://m.weibo.cn/detail/${info?.mid}`);
      }
    }

    /**动态发布时间 */
    let created_time = this.getDynamicCreatetDate(raw_post);

    let detail_url = `https://weibo.com/${info?.user?.id}/${info?.bid}`;

    let msg_meta = `微博【${upName}】动态推送：\n`;

    const dynamicPicCountLimit = setData.pushPicCountLimit || 3;

    function formatNumber(num: number): string {
      if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}万`;
      }
      return num.toString();
    }

    switch (dynamicType) {
      case 'DYNAMIC_TYPE_AV':
        if (!info) return;

        video_pics_list = info?.pics ? info?.pics : info?.page_info?.page_pic?.url ? [{ large: { url: info.page_info.page_pic.url } }] : [];

        pic_urls = video_pics_list.map(img => img?.large?.url);
        for (const pic_url of pic_urls) {
          const temp = segment.image(pic_url, false, 15000, { referer: 'https://weibo.com' });
          pics.push(temp);
        }

        msg_meta = `微博【${upName}】视频动态推送：\n`;
        msg = [
          msg_meta,
          `\n--------------------`,
          `\n${info?.page_info?.title || ''}`, //标题
          `\n--------------------`,
          `\n正文：`,
          `\n${this.filterText(info?.text)}`,
          `\n--------------------`,
          `\n投稿：${created_time ? moment(created_time).format('YYYY年MM月DD日 HH:mm:ss') : ''}`,
          `\n--------------------`,
          `\n${formatNumber(info?.attitudes_count)}点赞 • ${formatNumber(info?.comments_count)}评论 • ${formatNumber(info?.reposts_count)}转发 `,
          `\n--------------------`,
          `\n链接：${detail_url}`
        ];

        return { msg, pics, dynamicType };
      case 'DYNAMIC_TYPE_DRAW':
        raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];

        if (!info && !raw_pics_list) return;

        if (raw_pics_list.length > dynamicPicCountLimit) raw_pics_list.length = dynamicPicCountLimit;

        pic_urls = raw_pics_list.map((img: any) => img?.large?.url);

        for (let pic_url of pic_urls) {
          const temp = segment.image(pic_url, false, 15000, { referer: 'https://weibo.com' });
          pics.push(temp);
        }

        msg_meta = `微博【${upName}】图文动态推送：\n`;
        msg = [
          msg_meta,
          `\n--------------------`,
          `\n正文：`,
          `\n${this.dynamicContentLimit(this.filterText(info?.text), setData)}`,
          `\n--------------------`,
          `\n投稿：${created_time ? moment(created_time).format('YYYY年MM月DD日 HH:mm:ss') : ''}`,
          `\n--------------------`,
          `\n${formatNumber(info?.attitudes_count)}点赞 • ${formatNumber(info?.comments_count)}评论 • ${formatNumber(info?.reposts_count)}转发 `,
          `\n--------------------`,
          `\n链接：${detail_url}`
        ];

        return { msg, pics, dynamicType };
      case 'DYNAMIC_TYPE_ARTICLE':
        if (!info) return;

        raw_pics_list = retweeted ? info?.retweeted_status?.pics || [] : info?.pics || [];

        if (raw_pics_list.length > dynamicPicCountLimit) raw_pics_list.length = dynamicPicCountLimit;

        pic_urls = raw_pics_list.map(img => img?.large?.url);

        for (const pic_url of pic_urls) {
          const temp = segment.image(pic_url, false, 15000, { referer: 'https://weibo.com' });
          pics.push(temp);
        }

        msg_meta = `微博【${upName}】文章动态推送：\n`;
        msg = [
          msg_meta,
          `\n--------------------`,
          `\n正文：`,
          `\n${this.dynamicContentLimit(this.filterText(info?.text), setData)}`,
          `\n--------------------`,
          `\n投稿：${created_time ? moment(created_time).format('YYYY年MM月DD日 HH:mm:ss') : ''}`,
          `\n--------------------`,
          `\n${formatNumber(info?.attitudes_count)}点赞 • ${formatNumber(info?.comments_count)}评论 • ${formatNumber(info?.reposts_count)}转发 `,
          `\n--------------------`,
          `\n链接：${detail_url}`
        ];

        return { msg, pics, dynamicType };
      case 'DYNAMIC_TYPE_FORWARD':
        if (!info) return;
        if (!info?.retweeted_status) return;

        const origin_post_info = info?.retweeted_status;
        isForward = true;
        let orig = await this.formatTextDynamicData(upName, origin_post_info, isForward, setData);
        let origContent: any[] = [];
        if (orig && typeof orig === 'object') {
          origContent = orig.msg.slice(2);
          pics = orig.pics;
        } else {
          return 'continue';
        }

        msg_meta = `微博【${upName}】转发动态推送：\n`;
        msg = [
          msg_meta,
          `\n--------------------`,
          `\n正文：`,
          `\n${this.dynamicContentLimit(this.filterText(info?.text), setData)}`,
          `\n--------------------`,
          `\n投稿：${created_time ? moment(created_time).format('YYYY年MM月DD日 HH:mm:ss') : ''}`,
          `\n--------------------`,
          `\n${formatNumber(info?.attitudes_count)}点赞 • ${formatNumber(info?.comments_count)}评论 • ${formatNumber(info?.reposts_count)}转发 `,
          `\n--------------------`,
          `\n链接：${detail_url}\n`,
          '\n>>>>以下为转发内容<<<<\n',
          ...origContent
        ];

        return { msg, pics, dynamicType };
      default:
        logger?.mark(`未处理的微博推送【${upName}】：${dynamicType}`);
        return 'continue';
    }
  }

  // 限制文字模式下动态内容的字数和行数
  static dynamicContentLimit(content: string, setData: any): string {
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
      } else {
        totalLength += lines[i].length;
      }
    }

    return lines.join('\n');
  }

  // 处理斜杠开头的url
  static formatUrl(url: string): string {
    return 0 == url.indexOf('//') ? `https:${url}` : url;
  }

  /**推送类型设置 */
  static typeHandle(up: any, msg: string, type: string) {
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
    const handleType = (action: 'add' | 'delete') => {
      let isHandled = false; // 标记是否有类型被处理

      // 遍历 typeMap 对象，根据 msg 中的关键字进行类型操作
      for (const [key, value] of Object.entries(typeMap)) {
        if (msg.indexOf(key) !== -1) {
          if (Array.isArray(value)) {
            // 如果 value 是数组，则对数组中的每个元素进行操作
            value.forEach(v => (action === 'add' ? newType.add(v) : newType.delete(v)));
          } else {
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
    } else if (type === 'del') {
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
