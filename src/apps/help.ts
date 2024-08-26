import { Segment, Messages } from 'yunzai';
import Image from '@/utils/image';
import { HelpPageProps } from '@/components/help/Help';
import Help from '@/models/help/help';
import { ScreenshotOptions } from '@/utils/puppeteer.render';

const message = new Messages('message');

/**
 * 优纪帮助
 */
message.use(
  async e => {
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
      isSplit: false,
      modelName: 'yukiHelp',
    };

    const helpImg = await Image.renderPage("help", "Help", renderData, ScreenshotOptionsData);

    let imgRes: { img: Buffer[]; }
    if (helpImg !== false) {
      const { img } = helpImg;
      imgRes = { img };
    } else {
      return;
    }
    let msg = [];
    msg.push(Segment.image(imgRes.img[0]));
    await e.reply(msg);
  },
  [/^(#|\/)(yuki|优纪)帮助$/]
)

export const YukiHelp = message.ok



