const MainPage = (await import('@/components/dynamic/MainPage')).default;
const VideoPage = (await import('@/components/video/VideoPage')).default;
const Help = (await import('@/components/help/Help')).default;
const LoginQrcodePage = (await import('@/components/loginQrcode/Page')).default;
const Version = (await import('@/components/version/Version')).default;

export { Help, LoginQrcodePage, MainPage, Version, VideoPage };
