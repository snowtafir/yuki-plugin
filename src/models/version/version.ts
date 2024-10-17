import fs from 'fs';
import path from 'path';
import { _paths } from '@src/utils/paths';

export default class VersionData {
  model: string;
  cache: any;
  versionPath: string;
  constructor() {
    this.model = 'versionData';
    this.cache = {};
    this.versionPath = path.resolve(_paths.pluginPath, 'CHANGELOG.md');
  }

  /**
   * CHANGELOG.md内容支持示例：
   * # 1.0.0
   * * 新增功能3
   * * 新增功能4
   *
   * # 0.1.0
   * * 新增功能1
   * * 新增功能2
   */
  async getChangelogContent() {
    let key = this.model;

    if (this.cache[key]) return this.cache[key];

    let content = fs.readFileSync(this.versionPath, 'utf8');
    let lines = content.split('\n');
    let result: Array<{ version: string; data: string[] }> = [];
    let currentVersion: string | null = null;
    let currentData: string[] = [];

    lines.forEach((line: string) => {
      line = line.trim();
      if (line.startsWith('# ')) {
        if (currentVersion) {
          result.push({
            version: currentVersion,
            data: currentData
          });
        }
        currentVersion = line.slice(2).trim();
        currentData = [];
      } else if (line.startsWith('* ')) {
        currentData.push(line.slice(2).trim());
      }
    });

    if (currentVersion) {
      result.push({
        version: currentVersion,
        data: currentData
      });
    }

    // 对版本进行排序并截取最新的10个版本
    result.sort((a, b) => {
      let aParts = a.version.split('.').map(Number);
      let bParts = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        let aPart = aParts[i] || 0;
        let bPart = bParts[i] || 0;
        if (aPart !== bPart) {
          return bPart - aPart;
        }
      }
      return 0;
    });

    this.cache[key] = result.slice(0, 10);
    return this.cache[key];
  }
}
