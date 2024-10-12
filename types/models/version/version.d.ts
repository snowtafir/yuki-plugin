export default class VersionData {
    model: string;
    cache: any;
    versionPath: string;
    constructor();
    getChangelogContent(): Promise<any>;
}
