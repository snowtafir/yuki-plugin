import React from 'react';
import Config from '../../utils/config';
import { createRequire } from 'react-puppeteer';
import path from 'path';
import { _paths } from '../../utils/paths';

const botPackageJsonPath = path.join(_paths.root, 'package.json');
const BOT_NAME = Config.getPackageJsonKey('name', botPackageJsonPath)
const botVersion = Config.getPackageJsonKey('version', botPackageJsonPath)
const yukiPluginVersion = Config.getPackageJsonKey('version', path.join(_paths.pluginPath, 'package.json'));

const require = createRequire(import.meta.url);

export type VersionProps = {
  data: {
    version: string;
    data: string[];
  }[];
}

export default function App({ data }: VersionProps) {
  return (
    <>
      <link rel="stylesheet" href={require("./../../resources/css/version/version.css")} />
      <div className="container" id="container">
        {data.map((item, idx) => (
          <div key={idx} className="version-card">
            <div className="title">{item.version}{idx ? '' : ' - 当前版本'}</div>
            <div className="content">
              <ul>
                {item.data.map((sub, subIdx) => (
                  <li key={subIdx} dangerouslySetInnerHTML={{ __html: sub }} />
                ))}
              </ul>
            </div>
          </div>
        ))}
        <div className="logo" style={{ marginTop: '6px' }}>
          Created By {`${BOT_NAME}-v` + `${botVersion}`} & <span className="yuki-plugin-text-title">yuki-plugin</span>-v
          <span className="italic">{`${yukiPluginVersion}`}</span>
        </div>
      </div>
    </>
  );
};