import React from 'react';
import Account from '../dynamic/Account.js';
import Footer from '../dynamic/Footer.js';
import VideoComments from './VideoComments.js';
import { createRequire } from '../../utils/paths.js';

const require$1 = createRequire(import.meta.url);
const MainPageCss = require$1('./../../resources/css/dynamic/MainPage.css');
const VideoPageCss = require$1('./../../resources/css/video/VideoPage.css');
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: MainPageCss }),
        React.createElement("link", { rel: "stylesheet", href: VideoPageCss }),
        React.createElement("div", { className: "outside-border" },
            React.createElement("div", { className: "container" },
                React.createElement(Account, { data: data }),
                React.createElement("div", { className: "dynamic-article-page-main unfold" },
                    React.createElement("div", { className: "video-page" },
                        React.createElement("h1", { className: "video-title" }, data.title),
                        React.createElement("div", { className: "video-subline" },
                            React.createElement("span", null, data.bvid),
                            React.createElement("span", null, data.tname)),
                        data.cover && (React.createElement("div", { className: "video-cover" },
                            React.createElement("img", { src: data.cover, alt: data.title }))),
                        React.createElement("div", { className: "video-meta" },
                            React.createElement("span", null, data.pubTime),
                            React.createElement("span", null,
                                "\u65F6\u957F ",
                                data.duration),
                            React.createElement("span", null, data.copyright)),
                        React.createElement("div", { className: "video-stats" }, data.stats.map(stat => (React.createElement("div", { className: "video-stat", key: stat.label },
                            React.createElement("span", { className: "video-stat-value" }, stat.value),
                            React.createElement("span", { className: "video-stat-label" }, stat.label))))),
                        data.desc && (React.createElement("section", { className: "video-description" },
                            React.createElement("div", { className: "video-description-title" }, "\u89C6\u9891\u7B80\u4ECB"),
                            React.createElement("div", { className: "video-description-content" }, data.desc))),
                        React.createElement(VideoComments, { comments: data.comments }))),
                React.createElement(Footer, { data: data })))));
}

export { App as default };
