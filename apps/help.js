import { Plugin, Segment } from 'yunzai';
import Image from '../utils/image.js';
import Help from '../models/help/help.js';

class YukiHelp extends Plugin {
    constructor() {
        super();
        this.rule = [
            {
                reg: "^(#|\/)(yuki|优纪)帮助$",
                fnc: this.yukiHelp.name,
            },
        ];
    }
    ;
    async yukiHelp() {
        const helpData = await Help.get();
        const renderData = {
            data: helpData.map((item) => ({
                group: item.group,
                list: item.list.map((listItem) => ({
                    icon: listItem.icon,
                    title: listItem.title,
                    desc: listItem.desc
                }))
            }))
        };
        const ScreenshotOptionsData = {
            isSplit: false,
            modelName: 'yukiHelp',
        };
        const helpImg = await Image.renderPage("help", "Help", renderData, ScreenshotOptionsData);
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

export { YukiHelp as default };