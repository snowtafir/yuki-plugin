import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const _path = process.cwd()
const thisFilePath = dirname(fileURLToPath(import.meta.url));
const pluginPath = join(thisFilePath, '..');

export const pluginName = basename(pluginPath);

export const _paths = {
  root: _path, // Bot根目录
  botData: join(_path, 'data'),// BotData目录
  botYukiData: join(_path, 'data/yuki-plugin'),// yuki-Data目录
  botTempPath: join(_path, 'temp'), // Bot缓存目录
  pluginPath, // yuki-plugin根目录
  pluginResources: join(pluginPath, 'resources'), // yuki-plugin资源目录
  pluginName, // 插件所在文件夹名称
}