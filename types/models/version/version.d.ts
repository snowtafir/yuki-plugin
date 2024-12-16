export default class VersionData {
    model: string;
    cache: any;
    versionPath: string;
    constructor();
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
    getChangelogContent(): Promise<any>;
}
