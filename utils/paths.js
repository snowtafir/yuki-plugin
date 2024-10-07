import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const _path = process.cwd();
const thisFilePath = dirname(fileURLToPath(import.meta.url));
const pluginPath = join(thisFilePath, '..');
const pluginName = basename(pluginPath);
const _paths = {
    root: _path,
    botData: join(_path, 'data'),
    botYukiData: join(_path, 'data/yuki-plugin'),
    botTempPath: join(_path, 'temp'),
    pluginPath,
    pluginResources: join(pluginPath, 'resources'),
    pluginName,
};
const createRequire = (basePath) => {
    return (path) => {
        if (process.platform === 'linux' || process.platform === 'android' || process.platform === 'darwin') {
            return new URL(path, basePath).href.replace(/^file:\/\//, '');
        }
        else {
            return new URL(path, basePath).href.replace(/^file:\/\/\//, '');
        }
    };
};

export { _paths, createRequire, pluginName };
