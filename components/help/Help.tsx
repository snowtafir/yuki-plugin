//help.tsx
import React from 'react';
import Config from '../../utils/config';
import { createRequire } from 'module';

const BOT_NAME = 'yunzai'
const botVersion = "3.1+"

const require = createRequire(import.meta.url);

export type HelpPageProps = {
  data: {
    group: string;
    list: {
      icon: string;
      title: string;
      desc: string;
    }[];
  }[];
}

export default function App({ data }: HelpPageProps) {
  return (
    <>
      <link rel="stylesheet" href={require('./../../resources/css/help/help.css')} />
      <div className="container" id="container">
        <div className="head_box">
          <div className="id_text">Yuki-Plugin</div>
          <h2 className="day_text">使用说明-v{Config.getLatestVersion()}</h2>
        </div>
        {data.map((val, index) => (
          <div className="data_box" key={index}>
            <div className="tab_lable">
              {val.group}
            </div>
            <div className="list">
              {val.list.map((item, itemIndex) => (
                <div className="item" key={itemIndex}>
                  <img className="icon" src={require(`./../../resources/img/icon/puplic/${item.icon}.png`)} alt={item.title} />
                  <div className="title">
                    <div className="text">{item.title}</div>
                    <div className="dec">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="logo" style={{ marginTop: '6px' }}>
          Created By {`${BOT_NAME}-v` + `${botVersion}`} & <span className="yuki-plugin-text-title">yuki-plugin</span>-v
          <span className="italic">{`${Config.getLatestVersion()}`}</span>
        </div>
      </div>
    </>
  );
};

