import React from 'react';
import { _paths } from '../../utils/paths.js';
import path from 'path';

const ContentBoxGrid4Css = path.join(_paths.pluginResources, 'css/dynamic/Content.box.grid.4.css');
const ContentBoxGrid9Css = path.join(_paths.pluginResources, 'css/dynamic/Content.box.grid.9.css');
const ContentCss = path.join(_paths.pluginResources, 'css/dynamic/Content.css');
const Content = ({ data }) => {
    const picItems = data.pics && (React.createElement("div", { className: 'pic-content' }, data.pics.map((item, index) => {
        if (item) {
            return (React.createElement("div", { className: "pic-item", key: `${index}_0` },
                React.createElement("img", { key: `${index}_1`, src: item?.url, alt: " " })));
        }
        return null;
    })));
    const boxGrid_4 = React.createElement("link", { key: "0", rel: "stylesheet", href: ContentBoxGrid4Css });
    const boxGrid_9 = React.createElement("link", { key: "0", rel: "stylesheet", href: ContentBoxGrid9Css });
    function getBoxGridStyle(pics) {
        if (!Array.isArray(pics) || pics.length === 0) {
            return null;
        }
        if (pics.length <= 1) {
            return null;
        }
        if (pics.length === 2) {
            for (const item of pics) {
                if (item.width === undefined || item.height === undefined) {
                    continue;
                }
                if (item.width / item.height <= 0.5) {
                    return null;
                }
            }
            for (const item of pics) {
                if (item.width === undefined) {
                    continue;
                }
                if (item.width > 1240) {
                    return null;
                }
            }
            return boxGrid_4;
        }
        if (pics.length >= 3) {
            for (const item of pics) {
                if (item.width === undefined || item.height === undefined) {
                    continue;
                }
                if (item.width / item.height <= 0.5) {
                    return null;
                }
            }
            for (const item of pics) {
                if (item.width === undefined) {
                    continue;
                }
                if (item.width > 1240) {
                    return null;
                }
            }
            const maxWidth = Math.max(...pics.map(item => item.width));
            if (maxWidth > 550 && maxWidth <= 1240) {
                return boxGrid_4;
            }
            return boxGrid_9;
        }
        return null;
    }
    const boxGrid = data.boxGrid && (data.pics && getBoxGridStyle(data.pics));
    const contentCss = React.createElement("link", { rel: "stylesheet", href: ContentCss });
    switch (data.type) {
        case 'DYNAMIC_TYPE_LIVE_RCMD':
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    picItems,
                    data.title && React.createElement("h1", null, data.title))));
        case 'DYNAMIC_TYPE_AV':
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    picItems,
                    React.createElement("div", { className: "content-text-title", style: { marginBottom: '10px' } }, data.title && React.createElement("h1", null, data.title)),
                    React.createElement("div", { className: "content-text", dangerouslySetInnerHTML: { __html: data.content || '' } }))));
        case 'DYNAMIC_TYPE_WORD':
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    React.createElement("div", { className: "content-text", dangerouslySetInnerHTML: { __html: data.content || '' } }),
                    picItems)));
        case 'DYNAMIC_TYPE_DRAW':
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    React.createElement("div", { className: "content-text", dangerouslySetInnerHTML: { __html: data.content || '' } }),
                    picItems)));
        case 'DYNAMIC_TYPE_ARTICLE':
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    React.createElement("div", { className: "content-text-title", style: { marginBottom: '10px' } }, data.title && React.createElement("h1", null, data.title)),
                    React.createElement("div", { className: "content-text", dangerouslySetInnerHTML: { __html: data.content || '' } }),
                    picItems)));
        default:
            return (React.createElement(React.Fragment, null,
                contentCss,
                boxGrid,
                React.createElement("div", { className: "content" },
                    data.title && React.createElement("h1", null, data.title),
                    React.createElement("div", { className: "content-text", dangerouslySetInnerHTML: { __html: data.content || '' } }),
                    picItems)));
    }
};
var Content$1 = Content;

export { Content$1 as default };
