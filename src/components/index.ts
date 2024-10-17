const MainPage = (await import('@src/components/dynamic/MainPage')).default;
const Help = (await import('@src/components/help/Help')).default;
const LoginQrcodePage = (await import('@src/components/loginQrcode/Page')).default;
const Version = (await import('@src/components/version/Version')).default;

export { Help, LoginQrcodePage, MainPage, Version };
