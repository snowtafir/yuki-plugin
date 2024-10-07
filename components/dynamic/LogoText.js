import React from 'react';
import { createRequire } from '../../utils/paths.js';

const require = createRequire(import.meta.url);
const LogoTextCss = require('./../../resources/css/dynamic/LogoText.css');
const LogoText = ({ data }) => (React.createElement(React.Fragment, null,
    React.createElement("link", { rel: "stylesheet", href: LogoTextCss }),
    data.appName === 'bilibili' && (React.createElement("div", { className: "bilibili-logo-text" }, data.category)),
    data.appName === 'weibo' && (React.createElement("div", { className: "weibo-logo-text" }, data.category))));

export { LogoText as default };
