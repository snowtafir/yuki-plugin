// MainPage.tsx
import React from 'react';
import Account from '@/components/dynamic/Account';
import Content from '@/components/dynamic/Content';
import ForwardContent from '@/components/dynamic/ForwardContent';
import Footer from '@/components/dynamic/Footer';
import { _paths, createRequire } from '@/utils/paths';

const require = createRequire(import.meta.url);

const MainPageCss: string = require('./../../../resources/css/dynamic/MainPage.css');

export type MainProps = {
  data: {
    appName: string;
    boxGrid?: boolean;
    type?: string;
    face?: string;
    pendant?: string;
    name?: string;
    pubTs: any;
    title?: string;
    content?: string;
    urlImgData?: string;
    created?: any;
    pics?: Array<any>;
    category?: string;
    orig?: {
      data?: {
        type?: string;
        face?: string;
        pendant?: string;
        name?: string;
        pubTs?: any;
        title?: string;
        content?: string;
        urlImgData?: string;
        created?: any;
        pics?: string[];
        category?: string;
      };
    };
  };
};

export default function App({ data }: MainProps) {
  return (
    <>
      <link rel="stylesheet" href={MainPageCss} />
      <div className="outside-border">
        <div className="container">
          <Account data={data} />
          <div className="dynamic-article-page-main unfold">
            <Content data={data} />
            {data.orig && (
              <>
                <ForwardContent data={data.orig.data} />
              </>
            )}
          </div>
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}
