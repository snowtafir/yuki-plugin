// ForwardContent
// 转发动态内容组件
import React from 'react';
import Account from '@src/components/dynamic/Account';
import Content from '@src/components/dynamic/Content';
import { _paths, createRequire } from '@src/utils/paths';

const require = createRequire(import.meta.url);

const ForwardContentCss: string = require('./../../../resources/css/dynamic/ForwardContent.css');

type ForwardContentProps = {
  data?: any;
};

const ForwardContent: React.FC<ForwardContentProps> = ({ data }) => (
  <>
    <link rel="stylesheet" href={ForwardContentCss} />
    <div className="orig">
      <div className="orig-container" id="orig-container">
        <Account data={data} />
        <Content data={data} />
      </div>
    </div>
  </>
);

export default ForwardContent;
