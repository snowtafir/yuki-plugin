import React from 'react';
import Config from '../../utils/config.js';
import path from 'path';
import { _paths, createRequire } from '../../utils/paths.js';

const require = createRequire(import.meta.url);
const botPackageJsonPath = path.join(_paths.root, 'package.json');
const BOT_NAME = Config.getPackageJsonKey('name', botPackageJsonPath);
const botVersion = Config.getPackageJsonKey('version', botPackageJsonPath);
const yukiPluginVersion = Config.getPackageJsonKey('version', path.join(_paths.pluginPath, 'package.json'));
const HelpCss = require('./../../resources/css/help/help.css');
const iconPath = (iconName) => require(`./../../resources/img/icon/puplic/${iconName}.png`);
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: HelpCss }),
        React.createElement("div", { className: "container", id: "container" },
            React.createElement("div", { className: "head_box" },
                React.createElement("div", { className: "id_text" }, "Yuki-Plugin"),
                React.createElement("h2", { className: "day_text" },
                    "\u4F7F\u7528\u8BF4\u660E-v",
                    yukiPluginVersion)),
            data.map((val, index) => (React.createElement("div", { className: "data_box", key: index },
                React.createElement("div", { className: "tab_lable" }, val.group),
                React.createElement("div", { className: "list" }, val.list.map((item, itemIndex) => (React.createElement("div", { className: "item", key: itemIndex },
                    React.createElement("img", { className: "icon", src: iconPath(item.icon), alt: item.title }),
                    React.createElement("div", { className: "title" },
                        React.createElement("div", { className: "text" }, item.title),
                        React.createElement("div", { className: "dec" }, item.desc))))))))),
            React.createElement("div", { className: "logo", style: { marginTop: '6px' } },
                "Created By ",
                `${BOT_NAME}-v` + `${botVersion}`,
                " & ",
                React.createElement("span", { className: "yuki-plugin-text-title" }, "yuki-plugin"),
                "-v",
                React.createElement("span", { className: "italic" }, yukiPluginVersion)))));
}

export { App as default };
