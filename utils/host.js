import * as fs from 'fs';
import * as path from 'path';
import { _paths } from './paths.js';

// 读取宿主 package.json 的 name 字段
function getHostName() {
    try {
        const pkgPath = path.join(_paths.root, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return pkg.name || '';
    }
    catch (e) {
        return '';
    }
}
function getHostType() {
    const name = getHostName();
    if (name === 'yunzai-pe' || name === 'yunzai-core')
        return 'yunzaijs';
    if (name === 'trss-yunzai')
        return 'trss';
    if (name === 'miao-yunzai')
        return 'miao';
    return 'other';
}
// 动态导入依赖
let Plugin, Segment, Redis;
const hostType = getHostType();
if (hostType === 'yunzaijs') {
    // yunzai-pe/yunzai-core
    await import('yunzaijs').then(yunzaijs => {
        Plugin = yunzaijs.Plugin;
        Segment = yunzaijs.Segment;
        Redis = yunzaijs.Redis;
    });
}
else {
    // trss/miao/other
    // plugin基类路径兼容trss/miao等
    const pluginModule = await import(path.join(_paths.root, 'lib', 'plugins', 'plugin.js'));
    Plugin = pluginModule.default || pluginModule;
    Segment = global.segment || (global.segment = global.oicq ? global.oicq.segment : global.icqq ? global.icqq.segment : undefined);
    Redis = global.redis;
}
// logger全局
const logger = global.logger;

export { Plugin, Redis, Segment, hostType, logger };
