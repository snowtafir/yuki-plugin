import { Messages, Segment } from 'yunzaijs';
import { renderPage } from '@src/utils/image';
import { VersionProps } from '@src/components/version/Version';
import VersionData from '@src/models/version/version';
import { ScreenshotOptions } from '@src/utils/puppeteer.render';

const message = new Messages('message');

/**
 * 优纪版本
 */
message.use(
  async e => {
    const version = new VersionData();
    const versionData = await version.getChangelogContent();

    const renderData: VersionProps = {
      data: versionData.map((item: any) => ({
        version: item.version,
        data: item.data
      }))
    };
    const ScreenshotOptionsData: ScreenshotOptions = {
      SOptions: {
        type: 'webp',
        quality: 90
      },
      isSplit: false,
      modelName: 'yukiVersion'
    };

    const helpImg = await renderPage('version', 'Version', renderData, ScreenshotOptionsData);

    let imgRes: { img: Buffer[] };
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
  [/^(#|\/)(yuki|优纪)版本$/]
);

export const YukiVersion = message.ok;
