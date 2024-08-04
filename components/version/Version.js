import React from 'react';
import Config from '../../utils/config.js';
import { createRequire } from 'module';

const BOT_NAME = 'yunzai';
const botVersion = "3.1+";
const require = createRequire(import.meta.url);
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: require("./../../resources/css/version/version.css") }),
        React.createElement("div", { className: "container", id: "container" },
            data.map((item, idx) => (React.createElement("div", { key: idx, className: "version-card" },
                React.createElement("div", { className: "title" },
                    item.version,
                    idx ? '' : ' - 当前版本'),
                React.createElement("div", { className: "content" },
                    React.createElement("ul", null, item.data.map((sub, subIdx) => (React.createElement("li", { key: subIdx, dangerouslySetInnerHTML: { __html: sub } })))))))),
            React.createElement("div", { className: "logo", style: { marginTop: '6px' } },
                "Created By ",
                `${BOT_NAME}-v` + `${botVersion}`,
                " & ",
                React.createElement("span", { className: "yuki-plugin-text-title" }, "yuki-plugin"),
                "-v",
                React.createElement("span", { className: "italic" }, `${Config.getLatestVersion()}`)))));
}

export { App as default };
