import React from 'react';
import Account from './Account.js';
import Content from './Content.js';
import { createRequire } from '../../utils/paths.js';

const require = createRequire(import.meta.url);
const ForwardContentCss = require('./../../resources/css/dynamic/ForwardContent.css');
const ForwardContent = ({ data }) => (React.createElement(React.Fragment, null,
    React.createElement("link", { rel: "stylesheet", href: ForwardContentCss }),
    React.createElement("div", { className: "orig" },
        React.createElement("div", { className: "orig-container", id: "orig-container" },
            React.createElement(Account, { data: data }),
            React.createElement(Content, { data: data })))));

export { ForwardContent as default };
