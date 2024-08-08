// ForwardContent
// 转发动态内容组件
import React from 'react';
import Account from './Account.tsx';
import Content from './Content.tsx';
import { createRequire } from 'react-puppeteer';
const require = createRequire(import.meta.url)

type ForwardContentProps = {
  data?: any;
}

const ForwardContent: React.FC<ForwardContentProps> = ({ data }) => (
  <>
    <link rel="stylesheet" href={require("./../../../resources/css/dynamic/ForwardContent.css")} />
    <div className="orig">
      <div className="orig-container" id="orig-container">
        <Account data={data} />
        <Content data={data} />
      </div>
    </div>
  </>
);

export default ForwardContent;
