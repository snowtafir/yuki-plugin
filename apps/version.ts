import { VersionProps } from '@/components/version/Version';
import VersionData from '@/models/version/version';
import { Plugin, Segment, hostType } from '@/utils/host';
import { renderPage } from '@/utils/image';
import { ScreenshotOptions } from '@/utils/puppeteer.render';

export default class YukiVersion extends Plugin {
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
    } else {
      super({ rule: rules });
    }
  }

  /**
   * 优纪版本
   */
  async yukiVersion() {
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
    let msg: any[] = [];
    msg.push(Segment.image(imgRes.img[0]));
    await this.e.reply(msg);
  }
}
