// Account
// up账户组件
import React from 'react';
import LogoText from '@/components/dynamic/LogoText';
import { _paths } from '@/utils/paths';
import path from 'path';

const Bilibililogo: string = path.join(_paths.pluginResources, 'img/icon/dynamic/bilibili.svg')
const Weibilogo: string = path.join(_paths.pluginResources, 'img/icon/dynamic/weibo.svg')
const AccountCss: string = path.join(_paths.pluginResources, 'css/dynamic/Account.css')

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
      <link rel="stylesheet" href={AccountCss} />
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
          {data.appName === 'bilibili' && renderLogo(Bilibililogo, 'bilibili-logo')}
          {data.appName === 'weibo' && renderLogo(Weibilogo, 'weibo-logo')}
          <LogoText data={data} />
        </div>
      </div>
    </>
  );
};

export default Account;

