import React from 'react';
import Account from './Account.js';
import Content from './Content.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ForwardContent = ({ data }) => (React.createElement(React.Fragment, null,
    React.createElement("link", { rel: "stylesheet", href: require("./../../resources/css/dynamic/ForwardContent.css") }),
    React.createElement("div", { className: "orig" },
        React.createElement("div", { className: "orig-container", id: "orig-container" },
            React.createElement(Account, { data: data }),
            React.createElement(Content, { data: data })))));
var ForwardContent$1 = ForwardContent;

export { ForwardContent$1 as default };
