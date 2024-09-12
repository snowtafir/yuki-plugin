// ForwardContent
// 转发动态内容组件
import React from 'react';
import Account from '@/components/dynamic/Account.tsx';
import Content from '@/components/dynamic/Content.tsx';
import { _paths } from '@/utils/paths';
import path from 'path';

const ForwardContentCss: string = path.join(_paths.pluginResources, 'css/dynamic/ForwardContent.css');

type ForwardContentProps = {
  data?: any;
}

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