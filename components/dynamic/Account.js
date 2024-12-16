import React from 'react';
import LogoText from './LogoText.js';
import { createRequire } from '../../utils/paths.js';

// Account
// up账户组件
const require = createRequire(import.meta.url);
const Bilibililogo = require('./../../resources/img/icon/dynamic/bilibili.svg');
const Weibilogo = require('./../../resources/img/icon/dynamic/weibo.svg');
const AccountCss = require('./../../resources/css/dynamic/Account.css');
const Account = ({ data }) => {
    const renderLogo = (logoSrc, className) => React.createElement("img", { src: logoSrc, className: className, alt: "logo" });
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: AccountCss }),
        React.createElement("div", { className: "account" },
            React.createElement("div", { className: "avatar-container" },
                React.createElement("img", { src: data.face, alt: "\u5934\u50CF", className: "avatar" }),
                data.pendant && React.createElement("img", { className: "pendant", src: data.pendant, alt: "pendant" }),
                React.createElement("div", { className: "account-info" },
                    React.createElement("div", { className: "nickname" }, data.name || ''),
                    React.createElement("div", { className: "timestamp" }, data.pubTs || ''))),
            React.createElement("div", { className: "logo-container" },
                data.appName === 'bilibili' && renderLogo(Bilibililogo, 'bilibili-logo'),
                data.appName === 'weibo' && renderLogo(Weibilogo, 'weibo-logo'),
                React.createElement(LogoText, { data: data })))));
};

export { Account as default };
