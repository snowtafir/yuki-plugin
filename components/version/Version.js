import React from 'react';
import Config from '../../utils/config.js';
import path from 'path';
import { createRequire, _paths } from '../../utils/paths.js';

const require = createRequire(import.meta.url);
const botPackageJsonPath = path.join(_paths.root, 'package.json');
const BOT_NAME = Config.getPackageJsonKey('name', botPackageJsonPath);
const botVersion = Config.getPackageJsonKey('version', botPackageJsonPath);
const yukiPluginVersion = Config.getPackageJsonKey('version', path.join(_paths.pluginPath, 'package.json'));
const VersionCss = require('./../../resources/css/version/version.css');
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: VersionCss }),
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
                React.createElement("span", { className: "italic" }, yukiPluginVersion)))));
}

export { App as default };
