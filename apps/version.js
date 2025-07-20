import VersionData from '../models/version/version.js';
import { Plugin, hostType, Segment } from '../utils/host.js';
import { renderPage } from '../utils/image.js';

class YukiVersion extends Plugin {
    constructor() {
        const rules = [
            {
                reg: '^(#|/)(yuki|优纪)版本$',
                fnc: 'yukiVersion'
            }
        ];
        if (hostType === 'yunzaijs') {
            super();
            this.rule = rules.map(r => ({ ...r, fnc: this[r.fnc].name }));
        }
        else {
            super({ rule: rules });
        }
    }
    /**
     * 优纪版本
     */
    async yukiVersion() {
        const version = new VersionData();
        const versionData = await version.getChangelogContent();
        const renderData = {
            data: versionData.map((item) => ({
                version: item.version,
                data: item.data
            }))
        };
        const ScreenshotOptionsData = {
            SOptions: {
                type: 'webp',
                quality: 90
            },
            isSplit: false,
            modelName: 'yukiVersion'
        };
        const helpImg = await renderPage('version', 'Version', renderData, ScreenshotOptionsData);
        let imgRes;
        if (helpImg !== false) {
            const { img } = helpImg;
            imgRes = { img };
        }
        else {
            return;
        }
        let msg = [];
        msg.push(Segment.image(imgRes.img[0]));
        await this.e.reply(msg);
    }
}

export { YukiVersion as default };
