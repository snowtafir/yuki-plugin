// Footer.tsx
import React from 'react';
import { BOT_NAME, ConfigController } from 'yunzai';
import Config from '@/utils/config';
import { createRequire } from 'react-puppeteer';

const botVersion = ConfigController.package?.version

const require = createRequire(import.meta.url)
const bilibililogo: string = require('./../../../resources/img/icon/dynamic/bilibili.svg')
const weibilogo: string = require('./../../../resources/img/icon/dynamic/weibo.svg')

type FooterProps = {
  data: {
    appName?: string;
    category?: string;
    urlImgData?: string;
    created?: string;
  };
}

const Footer: React.FC<FooterProps> = ({ data }) => {

  return (
    <>
      <link rel="stylesheet" href={require('./../../../resources/css/dynamic/Footer.css')} />
      <div className="footer">
        <div className="footer-text-container">
          {data.appName === 'bilibili' && (
            <svg className='w-32 h-10 bili-logo-0' style={{ width: '8rem', height: '2.5rem' }}>
              <image href={bilibililogo} />
            </svg>
          )}
          {data.appName === 'weibo' && (
            <svg className='h-12 weibo-logo-0' style={{ height: '3rem' }}>
              <image href={weibilogo} width="55" height="55" />
            </svg>
          )}
          <div className="qr-code-massage" style={{ marginTop: '-4px' }}>
            识别二维码，查看完整{data.category}
          </div>
          <div className="creatde-time" style={{ marginTop: '6px', color: '#a46e8a' }}>
            图片生成于：{data.created || ""}
          </div>
          <div className="bot-plugin-info" style={{ marginTop: '6px' }}>
            Created By {`${BOT_NAME}-v` + `${botVersion}`} & <span className="yuki-plugin-text-title">yuki-plugin</span>-v
            <span className="italic">{`${Config.getLatestVersion()}`}</span>
          </div>
        </div>
        <img src={data.urlImgData} alt="二维码" className="qr-code" />
      </div>
    </>
  );
};

export default Footer;

