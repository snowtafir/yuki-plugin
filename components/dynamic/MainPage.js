import React from 'react';
import Account from './Account.js';
import Content from './Content.js';
import ForwardContent from './ForwardContent.js';
import Footer from './Footer.js';
import { createRequire } from '../../utils/paths.js';

const require = createRequire(import.meta.url);
const MainPageCss = require('./../../resources/css/dynamic/MainPage.css');
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: MainPageCss }),
        React.createElement("div", { className: "outside-border" },
            React.createElement("div", { className: "container" },
                React.createElement(Account, { data: data }),
                React.createElement("div", { className: "dynamic-article-page-main unfold" },
                    React.createElement(Content, { data: data }),
                    data.orig && React.createElement(React.Fragment, null,
                        React.createElement(ForwardContent, { data: data.orig.data }))),
                React.createElement(Footer, { data: data })))));
}

export { App as default };
