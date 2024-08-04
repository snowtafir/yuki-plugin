import Image from '../utils/image.js';
import Help from '../models/help/help.js';
import plugin from '../../../lib/plugins/plugin.js';

class YukiHelp extends plugin {
    constructor() {
        super({
            name: "yuki-help",
            des: "优纪帮助",
            event: "message",
            priority: 550,
            rule: [
                {
                    reg: "^(#|\/)(yuki|优纪)帮助$",
                    fnc: "yukiHelp",
                },
            ]
        });
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
        msg.push(segment.image(imgRes.img[0]));
        await this.e.reply(msg);
    }
    ;
}

export { YukiHelp as default };
