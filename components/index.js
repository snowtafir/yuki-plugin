const MainPage = (await import('./dynamic/MainPage.js')).default;
const Help = (await import('./help/Help.js')).default;
const LoginQrcodePage = (await import('./loginQrcode/Page.js')).default;
const Version = (await import('./version/Version.js')).default;

export { Help, LoginQrcodePage, MainPage, Version };
