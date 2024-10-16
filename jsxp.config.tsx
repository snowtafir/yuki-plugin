// react 热开发 router 配置文件
import React from 'react';
import QRCode from 'qrcode';
import { defineConfig } from 'jsxp';

const Page = (await import(`./src/components/dynamic/MainPage.tsx`)).default;
//const Page = (await import('./src/components/version/version.tsx')).default;
//const Page = (await import('./src/components/help/Help.tsx')).default;
//const Page = (await import('./src/components/loginQrcode/Page.tsx')).default;

//网页在线url图片资源加载不出，需到对应组件img标签添加：referrerPolicy='no-referrer'
const props = {
  data: {
    appName: 'bilibili',
    type: 'DYNAMIC_TYPE_DRAW',
    face: 'https://i2.hdslb.com/bfs/face/09dd0d38633d567179784ac9a0d95ac1187ea71d.jpg',
    pendant: '',
    name: '小白测评',
    pubTs: `${Date.now()}`,
    content: '关注微信公众号：小白测评 每晚发车不见不散',
    urlImgData: await QRCode.toDataURL('https://m.bilibili.com/opus/949167878184108051'),
    category: '文章动态',
    created: `2024-06-29 12:00:00`,
    pics: [
      { url: 'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg' },
      { url: 'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg' },
      { url: 'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg' }
    ]
    /*         orig: {
              appName: "bilibili",
              type: "DYNAMIC_TYPE_DRAW",
              face: "https://i2.hdslb.com/bfs/face/09dd0d38633d567179784ac9a0d95ac1187ea71d.jpg",
              pendant: "",
              name: "小白测评",
              pubTs: `${Date.now()}`,
              content: "关注微信公众号：小白测评 每晚发车不见不散",
              urlImgData: await (QRCode.toDataURL("https://m.bilibili.com/opus/949167878184108051")),
              category: "文章动态",
              created: `2024-06-29 12:00:00`,
              pics: [
              {url:'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg'},
              {url:'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg'},
              {url:'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg'},
              {url:'http://i0.hdslb.com/bfs/archive/e74c63cfec570974157be8d1f5e3582b355ad991.jpg'},
              ]
            } */
  }
};

/* const props ={
data:{[
      {
        "version": "2.0.0",
        "data": [
          "- 新增自动刷新tempck配置可选项，B站功能添加查看app扫码获取的登录ck的有效状态",
          "- <span class=\"cmd\">#我的B站登陆 </span>详细使用方法请查看 \"#闲心帮助\""
        ]
      },
      {
        "version": "1.0.0",
        "data": [
          "1.支持Yunzai-V4 初版"
        ]
      }
    ]}
  } */

/* const props ={
data:{[
      {
        "group": "B站功能",
        "list": [
          { icon: "树脂", title: "#订阅B站推送UID<br/>#订阅B站 图文 推送UID", desc: "检测up的B站动态进行推送" },
          { icon: "树脂", title: "#B站动态转发<br/>#转发B站动态", desc: "将B站动态转发到其他平台" },
          { icon: "树脂", title: "#B站动态评论<br/>#评论B站动态", desc: "对B站动态进行评论" },
          { icon: "树脂", title: "#B站动态点赞<br/>#点赞B站动态", desc: "对B站动态进行点赞" },
          { icon: "树脂", title: "#B站动态收藏<br/>#收藏B站动态", desc: "对B站动态进行收藏" },
          { icon: "树脂", title: "#B站动态分享<br/>#分享B站动态", desc: "分享B站动态到其他平台" },
          { icon: "树脂", title: "#B站动态转发到QQ空间<br/>#转发B站动态到QQ空间", desc: "将B站动态转发到QQ空间" },
          { icon: "树脂", title: "#B站动态转发到微博<br/>#转发B站动态到微博", desc: "将B站动态转发到微博" },
        ]
      },
      {
        "group": "微博功能",
        "list": [
          { icon: "树脂", title: "#订阅微博推送UID<br/>#订阅微博 图文 推送UID", desc: "检测up的微博动态进行推送" },
          { icon: "树脂", title: "#微博动态转发<br/>#转发微博动态", desc: "将微博动态转发到其他平台" },
          { icon: "树脂", title: "#微博动态评论<br/>#评论微博动态", desc: "对微博动态进行评论" },
          { icon: "树脂", title: "#微博动态点赞<br/>#点赞微博动态", desc: "对微博动态进行点赞" },
          { icon: "树脂", title: "#微博动态收藏<br/>#收藏微博动态", desc: "对微博动态进行收藏" },
          { icon: "树脂", title: "#微博动态分享<br/>#分享微博动态", desc: "分享微博动态到其他平台" },
          { icon: "树脂", title: "#微博动态转发到B站<br/>#转发微博动态到B站", desc: "将微博动态转发到B站" },
          { icon: "树脂", title: "#微博动态转发到QQ空间<br/>#转发微博动态到QQ空间", desc: "将微博动态转发到QQ空间" },
          { icon: "树脂", title: "#微博动态转发到微信<br/>#转发微博动态到微信", desc: "将微博动态转发到微信" },
        ]
      }
    ]}
  } */

/* const props ={
 data:{
      {
        url: "data:image/png;base64,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"
      }
  } */

export default defineConfig({
  routes: {
    '/dynamic': {
      component: <Page {...props} />
    }
  }
});
