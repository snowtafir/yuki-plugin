/* 调用puppeteer 测试渲染效果*/
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { MainProps } from './src/components/dynamic/MainPage';
import { renderPage } from './src/utils/image';
import { _paths } from './src/utils/paths';
import { ScreenshotOptions } from './src/utils/puppeteer.render';

const renderDynamicCard = async (uid: string | number, renderData: MainProps, ScreenshotOptionsData: ScreenshotOptions) => {
  const dynamicMsg = await renderPage(uid, 'MainPage', renderData, ScreenshotOptionsData); // 渲染动态卡片
  if (dynamicMsg !== false) {
    return dynamicMsg.img; // 缓存图片数据
  } else {
    return null;
  }
};

async function rederTest() {
  let boxGrid: boolean = true; // 是否启用九宫格样式，默认为 true
  let isSplit: boolean = true; // 是否启用分片截图，默认为 true
  let style: string = isSplit ? '' : `.unfold { max-height: 7500px; }`; // 不启用分片截图模式的样式
  let splitHeight: number = 8000; // 分片截图高度，默认 8000, 单位 px，启用分片截图时生效

  let renderData: MainProps = {
    data: {
      boxGrid: boxGrid,
      appName: 'bilibili',
      type: 'DYNAMIC_TYPE_DRAW',
      face: 'https://i2.hdslb.com/bfs/face/09dd0d38633d567179784ac9a0d95ac1187ea71d.jpg',
      pendant: '',
      name: '测试渲染',
      pubTs: `${Date.now()}`,
      content: '测试渲染，你好呀，诶哟，你干嘛！气死我了，怎么又卡了！求求你了！别卡了！',
      urlImgData: await QRCode.toDataURL('https://m.bilibili.com/opus/949167878184108051'),
      category: '图文动态',
      created: `2024-06-29 12:00:00`,
      pics: [
        { url: 'http://i2.hdslb.com/bfs/archive/a13d926413388358154e617718f53683ba39beb9.jpg' },
        { url: 'http://i2.hdslb.com/bfs/archive/a13d926413388358154e617718f53683ba39beb9.jpg' },
        { url: 'http://i2.hdslb.com/bfs/archive/a13d926413388358154e617718f53683ba39beb9.jpg' },
        { url: 'http://i2.hdslb.com/bfs/archive/a13d926413388358154e617718f53683ba39beb9.jpg' },
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

  const ScreenshotOptionsData: ScreenshotOptions = {
    addStyle: style,
    header: { Referer: 'https://space.bilibili.com/' },
    isSplit: isSplit,
    modelName: 'bilibili',
    SOptions: {
      type: 'webp',
      quality: 98
    },
    saveHtmlfile: true, // 是否同时保存对应的html文件
    pageSplitHeight: splitHeight
  };

  const uid = 233333;
  let imgs: Buffer[] | null = await renderDynamicCard(uid, renderData, ScreenshotOptionsData);
  if (!imgs) return;
  const Dir = path.join(_paths.root, `./temp/html/yuki-plugin/imgs/`);
  if (!fs.existsSync(Dir)) {
    fs.mkdirSync(Dir, { recursive: true });
  }
  fs.writeFileSync(`${Dir}${Date.now()}.webp`, imgs[0]);
}

await rederTest();
