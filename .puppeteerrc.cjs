const os = require('os');
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const arch = os.arch();

let skipDownload = false;
let executablePath;

if (['linux', 'android'].includes(process.platform))
  for (const item of ['chromium', 'chromium-browser', 'chrome', 'google-chrome'])
    try {
      const chromiumPath = execSync(`command -v ${item}`).toString().trim();
      if (chromiumPath && existsSync(chromiumPath)) {
        executablePath = chromiumPath;
        break;
      }
    } catch (err) {}

/**
 * @type {string} 浏览器 "可执行文件路径" 列表，可根据需要自行修改或添加
 */
if (!executablePath)
  for (const item of [
    // Windows
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ])
    if (existsSync(item)) {
      executablePath = item;
      break;
    }

if (executablePath || arch == 'arm64' || arch == 'aarch64') {
  (typeof logger != 'undefined' ? logger : console).info(`[Chromium] ${executablePath}`);
  skipDownload = true;
}

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = { skipDownload, executablePath };
