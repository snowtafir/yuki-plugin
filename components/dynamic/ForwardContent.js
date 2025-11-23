import React from 'react';
import Account from './Account.js';
import Content from './Content.js';
import { createRequire } from '../../utils/paths.js';

// ForwardContent
// 转发动态内容组件
const require$1 = createRequire(import.meta.url);
const ForwardContentCss = require$1('./../../resources/css/dynamic/ForwardContent.css');
const ForwardContent = ({ data }) => (React.createElement(React.Fragment, null,
    React.createElement("link", { rel: "stylesheet", href: ForwardContentCss }),
    React.createElement("div", { className: "orig" },
        React.createElement("div", { className: "orig-container", id: "orig-container" },
            React.createElement(Account, { data: data }),
            React.createElement(Content, { data: data })))));

export { ForwardContent as default };
