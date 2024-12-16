import { Plugin, Segment } from 'yunzaijs';
import { renderPage } from '@/utils/image';
import { HelpPageProps } from '@/components/help/Help';
import Help from '@/models/help/help';
import { ScreenshotOptions } from '@/utils/puppeteer.render';

export default class YukiHelp extends Plugin {
  constructor() {
    super();
    this.rule = [
      {
        reg: '^(#|/)(yuki|优纪)帮助$',
        fnc: this.yukiHelp.name
      }
    ];
  }

  /**
   * 优纪帮助
   */
  async yukiHelp() {
    const helpData = await Help.get();

    const renderData: HelpPageProps = {
      data: helpData.map((item: any) => ({
        group: item.group,
        list: item.list.map((listItem: any) => ({
          icon: listItem.icon,
          title: listItem.title,
          desc: listItem.desc
        }))
      }))
    };
    const ScreenshotOptionsData: ScreenshotOptions = {
      SOptions: {
        type: 'webp',
        quality: 90
      },
      isSplit: false,
      modelName: 'yukiHelp'
    };

    const helpImg = await renderPage('help', 'Help', renderData, ScreenshotOptionsData);

    let imgRes: { img: Buffer[] };
    if (helpImg !== false) {
      const { img } = helpImg;
      imgRes = { img };
    } else {
      return;
    }
    let msg: any[] = [];
    msg.push(Segment.image(imgRes.img[0]));
    await this.e.reply(msg);
  }
}
