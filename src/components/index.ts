const MainPage = (await import('./dynamic/MainPage')).default;
const Help = (await import('./help/Help')).default;
const LoginQrcodePage = (await import('./loginQrcode/Page')).default;
const Version = (await import('./version/Version')).default;

export { Help, LoginQrcodePage, MainPage, Version };
