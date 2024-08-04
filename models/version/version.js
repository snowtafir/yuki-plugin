import fs__default from 'fs';
import path from 'path';
import { _paths } from '../../utils/paths.js';

class VersionData {
    model;
    cache;
    versionPath;
    constructor() {
        this.model = 'versionData';
        this.cache = {};
        this.versionPath = path.resolve(_paths.pluginPath, 'CHANGELOG.md');
    }
    async getChangelogContent() {
        let key = this.model;
        if (this.cache[key])
            return this.cache[key];
        let content = fs__default.readFileSync(this.versionPath, 'utf8');
        let lines = content.split('\n');
        let result = [];
        let currentVersion = null;
        let currentData = [];
        lines.forEach((line) => {
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
            }
            else if (line.startsWith('* ')) {
                currentData.push(line.slice(2).trim());
            }
        });
        if (currentVersion) {
            result.push({
                version: currentVersion,
                data: currentData
            });
        }
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
        this.cache[key] = result.slice(0, 5);
        return this.cache[key];
    }
}

export { VersionData as default };
