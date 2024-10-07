import { renderPage } from '../utils/image.js';
import VersionData from '../models/version/version.js';
import plugin from '../../../lib/plugins/plugin.js';

class YukiVersion extends plugin {
    constructor() {
        super({
            name: 'yuki-version',
            dsc: '优纪版本',
            event: 'message',
            priority: 0,
            rule: [
                {
                    reg: '^(#|/)(yuki|优纪)版本$',
                    fnc: 'yukiVersion'
                }
            ]
        });
    }
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
        msg.push(segment.image(imgRes.img[0]));
        await this.e.reply(msg);
    }
}

export { YukiVersion as default };
