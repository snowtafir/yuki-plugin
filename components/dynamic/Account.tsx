// Account
// up账户组件
import React from 'react';
import LogoText from './LogoText.tsx';
import { createRequire } from 'module';
const require = createRequire(import.meta.url)


const bilibililogo: string = require('./../../resources/img/icon/dynamic/bilibili.svg')
const weibilogo: string = require('./../../resources/img/icon/dynamic/weibo.svg')

type AccountProps = {
  data: {
    appName: string;
    face?: string;
    pendant?: string;
    name?: string;
    pubTs?: any;
    category?: string;
  };
}

const Account: React.FC<AccountProps> = ({ data }) => {
  const renderLogo = (logoSrc: string, className: string) => (
    <img src={logoSrc} className={className} alt="logo" />
  );

  return (
    <>
      <link rel="stylesheet" href={require("./../../resources/css/dynamic/Account.css")} />
      <div className="account">
        <div className="avatar-container">
          <img src={data.face} alt="头像" className="avatar" />
          {data.pendant && <img className="pendant" src={data.pendant} alt="pendant" />}
          <div className="account-info">
            <div className="nickname">{data.name || ""}</div>
            <div className="timestamp">{data.pubTs || ""}</div>
          </div>
        </div>
        <div className="logo-container">
          {data.appName === 'bilibili' && renderLogo(bilibililogo, 'bilibili-logo')}
          {data.appName === 'weibo' && renderLogo(weibilogo, 'weibo-logo')}
          <LogoText data={data} />
        </div>
      </div>
    </>
  );
};

export default Account;

