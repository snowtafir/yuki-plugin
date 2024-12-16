import React from 'react';
import { createRequire } from '../../utils/paths.js';

// QrcodeLoginPage.tsx
const require = createRequire(import.meta.url);
const LoginQrcodeCss = require('./../../resources/css/loginQrcode/Page.css');
function App({ data }) {
    return (React.createElement(React.Fragment, null,
        React.createElement("link", { rel: "stylesheet", href: LoginQrcodeCss }),
        React.createElement("div", { className: "container w-96 max-h-96 m-auto text-lg p-5" },
            React.createElement("div", { className: "txt-0 text-center mt-3 mb-3 p-1 text-blue-500" },
                "Created By yuki-plugin",
                React.createElement("br", null),
                "\u626B\u7801\u767B\u5F55B\u7AD9\u83B7\u53D6CK"),
            React.createElement("div", { className: "QrCode m-auto" },
                React.createElement("img", { className: "qr-code w-72 h-72 ml-7", src: data.url, alt: "\u4E8C\u7EF4\u7801" })),
            React.createElement("div", { className: "txt-1 text-center mt-3 mb-3 p-1 text-red-600" },
                "\u514D\u8D23\u58F0\u660E\uFF1Abot\u4EC5\u63D0\u4F9B\u529F\u80FD\u3002",
                React.createElement("br", null),
                "\u5982\u679C\u4E0D\u826F\u4F7F\u7528\u884C\u4E3A\u5BFC\u81F4\u8D26\u53F7\u51FA\u95EE\u9898\u7684\u8BF7\u81EA\u884C\u627F\u62C5\u540E\u679C\u3002"))));
}

export { App as default };
