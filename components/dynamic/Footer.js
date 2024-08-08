import React from 'react';
import Config from '../../utils/config.js';
import { createRequire } from 'react-puppeteer';

const BOT_NAME = 'yunzai';
const botVersion = "3.1+";
const require = createRequire(import.meta.url);
const bilibililogo = require('./../../resources/img/icon/dynamic/bilibili.svg');
const weibilogo = require('./../../resources/img/icon/dynamic/weibo.svg');
const Footer = ({ data }) => {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: require('./../../resources/css/dynamic/Footer.css') }),
        React.createElement("div", { className: "footer" },
            React.createElement("div", { className: "footer-text-container" },
                data.appName === 'bilibili' && (React.createElement("svg", { className: 'w-32 h-10 bili-logo-0', style: { width: '8rem', height: '2.5rem' } },
                    React.createElement("image", { href: bilibililogo }))),
                data.appName === 'weibo' && (React.createElement("svg", { className: 'h-12 weibo-logo-0', style: { height: '3rem' } },
                    React.createElement("image", { href: weibilogo, width: "55", height: "55" }))),
                React.createElement("div", { className: "qr-code-massage", style: { marginTop: '-4px' } },
                    "\u8BC6\u522B\u4E8C\u7EF4\u7801\uFF0C\u67E5\u770B\u5B8C\u6574",
                    data.category),
                React.createElement("div", { className: "creatde-time", style: { marginTop: '6px', color: '#a46e8a' } },
                    "\u56FE\u7247\u751F\u6210\u4E8E\uFF1A",
                    data.created || ""),
                React.createElement("div", { className: "bot-plugin-info", style: { marginTop: '6px' } },
                    "Created By ",
                    `${BOT_NAME}-v` + `${botVersion}`,
                    " & ",
                    React.createElement("span", { className: "yuki-plugin-text-title" }, "yuki-plugin"),
                    "-v",
                    React.createElement("span", { className: "italic" }, `${Config.getLatestVersion()}`))),
            React.createElement("img", { src: data.urlImgData, alt: "\u4E8C\u7EF4\u7801", className: "qr-code" }))));
};
var Footer$1 = Footer;

export { Footer$1 as default };
