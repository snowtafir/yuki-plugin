import { basename,join } from 'path';

const _path = process.cwd()
export const pluginName = basename(join(import.meta.url, './../../'))
export const _paths = yukiPaths()

function yukiPaths() {
  // BotData目录
  const botData = join(_path, 'data')
  // Bot资源目录
  const botResources = join(_path, 'resources')
  // yuki-plugin根目录
  const pluginPath = join(_path, 'plugins', pluginName)
  // yuki-plugin资源目录
  const pluginResources = join(pluginPath, 'resources')

  return {
    root: _path, // Bot根目录
    botData,
    botResources,
    pluginPath,
    pluginResources,
    pluginName, // 插件所在文件夹名称
  }
}

