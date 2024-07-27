// LogoText
// Logo 文本组件
import React from 'react';
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

type LogoTextProps = {
  data: {
    appName: string;
    category?: string;
  };
}

const LogoText: React.FC<LogoTextProps> = ({ data }) => (
  <>
    <link rel="stylesheet" href={require('./../../resources/css/dynamic/LogoText.css')} />
    {data.appName === 'bilibili' && (
      <div className="bilibili-logo-text">{data.category}</div>
    )}
    {data.appName === 'weibo' && (
      <div className="weibo-logo-text">{data.category}</div>
    )}
  </>
);

export default LogoText;


