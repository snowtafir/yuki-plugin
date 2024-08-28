import { Plugin, Segment } from 'yunzai';
import Image from '../utils/image.js';
import VersionData from '../models/version/version.js';

class YukiVersion extends Plugin {
    constructor() {
        super();
        this.rule = [
            {
                reg: "^(#|\/)(yuki|优纪)版本$",
                fnc: this.yukiVersion.name,
            },
        ];
    }
    ;
    async yukiVersion() {
        const version = new VersionData;
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
                quality: 90,
            },
            isSplit: false,
            modelName: 'yukiVersion',
        };
        const helpImg = await Image.renderPage("version", "Version", renderData, ScreenshotOptionsData);
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
    ;
}

export { YukiVersion as default };
