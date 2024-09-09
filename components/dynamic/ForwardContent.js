import React from 'react';
import Account from './Account.js';
import Content from './Content.js';
import { _paths } from '../../utils/paths.js';
import path from 'path';

const ForwardContentCss = path.join(_paths.pluginResources, 'css/dynamic/ForwardContent.css');
const ForwardContent = ({ data }) => (React.createElement(React.Fragment, null,
    React.createElement("link", { rel: "stylesheet", href: ForwardContentCss }),
    React.createElement("div", { className: "orig" },
        React.createElement("div", { className: "orig-container", id: "orig-container" },
            React.createElement(Account, { data: data }),
            React.createElement(Content, { data: data })))));
var ForwardContent$1 = ForwardContent;

export { ForwardContent$1 as default };
