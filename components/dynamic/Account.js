import React from 'react';
import LogoText from './LogoText.js';
import { _paths } from '../../utils/paths.js';
import path from 'path';

const Bilibililogo = path.join(_paths.pluginResources, 'img/icon/dynamic/bilibili.svg');
const Weibilogo = path.join(_paths.pluginResources, 'img/icon/dynamic/weibo.svg');
const AccountCss = path.join(_paths.pluginResources, 'css/dynamic/Account.css');
const Account = ({ data }) => {
    const renderLogo = (logoSrc, className) => (React.createElement("img", { src: logoSrc, className: className, alt: "logo" }));
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: AccountCss }),
        React.createElement("div", { className: "account" },
            React.createElement("div", { className: "avatar-container" },
                React.createElement("img", { src: data.face, alt: "\u5934\u50CF", className: "avatar" }),
                data.pendant && React.createElement("img", { className: "pendant", src: data.pendant, alt: "pendant" }),
                React.createElement("div", { className: "account-info" },
                    React.createElement("div", { className: "nickname" }, data.name || ""),
                    React.createElement("div", { className: "timestamp" }, data.pubTs || ""))),
            React.createElement("div", { className: "logo-container" },
                data.appName === 'bilibili' && renderLogo(Bilibililogo, 'bilibili-logo'),
                data.appName === 'weibo' && renderLogo(Weibilogo, 'weibo-logo'),
                React.createElement(LogoText, { data: data })))));
};

export { Account as default };
