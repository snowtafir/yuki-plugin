const os = require('os');
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const arch = os.arch();

const commandCandidates = [
  'chromium',
  'chromium-browser',
  'chrome',
  'google-chrome',
  'google-chrome-stable',
  'google-chrome-beta',
  'google-chrome-canary',
  'microsoft-edge',
  'microsoft-edge-stable',
  'microsoft-edge-beta',
  'microsoft-edge-dev',
  'msedge',
  'msedge.exe',
  'chrome.exe',
  'brave-browser',
  'brave-browser-stable',
  'brave.exe'
];

const windowsProgramFiles = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.ProgramW6432].filter(Boolean);

const windowsLocalAppData = process.env.LOCALAPPDATA;

const darwinApplicationRoots = ['/Applications', path.join(os.homedir(), 'Applications')];

const uniquePaths = items => [...new Set(items)];

const platformPathCandidates = {
  android: uniquePaths([
    '/system/bin/chrome',
    '/system/bin/chromium',
    '/product/bin/chrome',
    '/product/bin/chromium',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chrome',
    '/data/data/com.termux/files/usr/bin/chromium',
    '/data/data/com.termux/files/usr/bin/chromium-browser',
    '/data/data/com.termux/files/usr/bin/google-chrome'
  ]),
  darwin: uniquePaths(
    darwinApplicationRoots.flatMap(root => [
      path.join(root, 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
      path.join(root, 'Google Chrome Beta.app', 'Contents', 'MacOS', 'Google Chrome Beta'),
      path.join(root, 'Google Chrome Canary.app', 'Contents', 'MacOS', 'Google Chrome Canary'),
      path.join(root, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(root, 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'),
      path.join(root, 'Microsoft Edge Beta.app', 'Contents', 'MacOS', 'Microsoft Edge Beta'),
      path.join(root, 'Microsoft Edge Dev.app', 'Contents', 'MacOS', 'Microsoft Edge Dev'),
      path.join(root, 'Microsoft Edge Canary.app', 'Contents', 'MacOS', 'Microsoft Edge Canary'),
      path.join(root, 'Brave Browser.app', 'Contents', 'MacOS', 'Brave Browser')
    ])
  ),
  linux: uniquePaths([
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome-beta',
    '/usr/bin/google-chrome-canary',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
    '/usr/bin/microsoft-edge-beta',
    '/usr/bin/microsoft-edge-dev',
    '/usr/bin/brave-browser',
    '/usr/bin/brave-browser-stable',
    '/usr/local/bin/chromium',
    '/usr/local/bin/chromium-browser',
    '/usr/local/bin/google-chrome',
    '/usr/local/bin/google-chrome-stable',
    '/usr/local/bin/microsoft-edge',
    '/usr/local/bin/brave-browser',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome-beta/chrome',
    '/opt/google/chrome-unstable/chrome',
    '/opt/microsoft/msedge/msedge',
    '/opt/microsoft/msedge-beta/msedge',
    '/opt/microsoft/msedge-dev/msedge',
    '/opt/brave.com/brave/brave-browser',
    '/snap/bin/chromium',
    '/snap/bin/chromium-browser',
    '/snap/bin/google-chrome',
    '/snap/bin/microsoft-edge',
    '/snap/bin/brave'
  ]),
  win32: uniquePaths([
    ...windowsProgramFiles.flatMap(root => [
      path.win32.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.win32.join(root, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'),
      path.win32.join(root, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'),
      path.win32.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.win32.join(root, 'Microsoft', 'Edge Beta', 'Application', 'msedge.exe'),
      path.win32.join(root, 'Microsoft', 'Edge Dev', 'Application', 'msedge.exe'),
      path.win32.join(root, 'Microsoft', 'Edge SxS', 'Application', 'msedge.exe'),
      path.win32.join(root, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    ]),
    ...(windowsLocalAppData
      ? [
          path.win32.join(windowsLocalAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.win32.join(windowsLocalAppData, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'),
          path.win32.join(windowsLocalAppData, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'),
          path.win32.join(windowsLocalAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.win32.join(windowsLocalAppData, 'Microsoft', 'Edge Beta', 'Application', 'msedge.exe'),
          path.win32.join(windowsLocalAppData, 'Microsoft', 'Edge Dev', 'Application', 'msedge.exe'),
          path.win32.join(windowsLocalAppData, 'Microsoft', 'Edge SxS', 'Application', 'msedge.exe'),
          path.win32.join(windowsLocalAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        ]
      : [])
  ]),
  default: uniquePaths([
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
    '/opt/google/chrome/chrome',
    '/opt/microsoft/msedge/msedge',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ])
};

function resolveExecutablePath() {
  let executablePath;

  if (['win32', 'linux', 'android', 'darwin'].includes(process.platform)) {
    for (const item of commandCandidates) {
      try {
        const lookupCommand = process.platform === 'win32' ? `where ${item}` : `command -v ${item}`;
        const commandOutput = execSync(lookupCommand).toString().trim();
        const commandPath = commandOutput
          .split(/\r?\n/)
          .map(line => line.trim())
          .find(itemPath => itemPath && existsSync(itemPath));
        if (commandPath) {
          executablePath = commandPath;
          break;
        }
      } catch {}
    }
  }

  if (!executablePath) {
    for (const item of [...(platformPathCandidates[process.platform] || []), ...platformPathCandidates.default]) {
      if (existsSync(item)) {
        executablePath = item;
        break;
      }
    }
  }

  return executablePath;
}

const executablePath = resolveExecutablePath();
const skipDownload = Boolean(executablePath || arch === 'arm64' || arch === 'aarch64');

if (skipDownload) {
  (typeof logger == 'object' ? logger : console).info(`browser: ${executablePath}`);
}

module.exports = { skipDownload, executablePath };
