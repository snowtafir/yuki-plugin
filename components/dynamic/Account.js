import React from 'react';
import LogoText from './LogoText.js';
import { createRequire } from 'react-puppeteer';

const require = createRequire(import.meta.url);
const bilibililogo = require('./../../resources/img/icon/dynamic/bilibili.svg');
const weibilogo = require('./../../resources/img/icon/dynamic/weibo.svg');
const Account = ({ data }) => {
    const renderLogo = (logoSrc, className) => (React.createElement("img", { src: logoSrc, className: className, alt: "logo" }));
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: require("./../../resources/css/dynamic/Account.css") }),
        React.createElement("div", { className: "account" },
            React.createElement("div", { className: "avatar-container" },
                React.createElement("img", { src: data.face, alt: "\u5934\u50CF", className: "avatar" }),
                data.pendant && React.createElement("img", { className: "pendant", src: data.pendant, alt: "pendant" }),
                React.createElement("div", { className: "account-info" },
                    React.createElement("div", { className: "nickname" }, data.name || ""),
                    React.createElement("div", { className: "timestamp" }, data.pubTs || ""))),
            React.createElement("div", { className: "logo-container" },
                data.appName === 'bilibili' && renderLogo(bilibililogo, 'bilibili-logo'),
                data.appName === 'weibo' && renderLogo(weibilogo, 'weibo-logo'),
                React.createElement(LogoText, { data: data })))));
};
var Account$1 = Account;

export { Account$1 as default };
