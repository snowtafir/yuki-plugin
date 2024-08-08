// MainPage.tsx
import React from 'react';
import Account from './Account.tsx';
import Content from './Content.tsx';
import ForwardContent from './ForwardContent';
import Footer from './Footer';
import { createRequire } from 'react-puppeteer';

const require = createRequire(import.meta.url)

export type MainProps = {
  data: {
    appName: string,
    boxGrid?: boolean,
    type?: string,
    face?: string,
    pendant?: string,
    name?: string,
    pubTs: any,
    title?: string
    content?: string,
    urlImgData?: string,
    created?: any,
    pics?: Array<any>
    category?: string,
    orig?: {
      data?: {
        type?: string,
        face?: string,
        pendant?: string,
        name?: string,
        pubTs?: any,
        title?: string
        content?: string,
        urlImgData?: string,
        created?: any,
        pics?: string[],
        category?: string,
      }
    },
  };
}

export default function App({ data }: MainProps) {
  return (
    <>
      <link rel="stylesheet" href={`${require('./../../../resources/css/dynamic/MainPage.css')}`} />
      <div className="outside-border">
        <div className="container">
          <Account data={data} />
          <div className="dynamic-article-page-main unfold">
            <Content data={data} />
            {data.orig && <><ForwardContent data={data.orig.data} /></>}
          </div>
          <Footer data={data} />
        </div>
      </div>
    </>
  );
};


