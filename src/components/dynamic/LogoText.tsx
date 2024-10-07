// LogoText
// Logo 文本组件
import React from 'react';
import { _paths, createRequire } from '@/utils/paths';

const require = createRequire(import.meta.url);

const LogoTextCss: string = require('./../../../resources/css/dynamic/LogoText.css')

type LogoTextProps = {
  data: {
    appName: string;
    category?: string;
  };
}

const LogoText: React.FC<LogoTextProps> = ({ data }) => (
  <>
    <link rel="stylesheet" href={LogoTextCss} />
    {data.appName === 'bilibili' && (
      <div className="bilibili-logo-text">{data.category}</div>
    )}
    {data.appName === 'weibo' && (
      <div className="weibo-logo-text">{data.category}</div>
    )}
  </>
);

export default LogoText;


