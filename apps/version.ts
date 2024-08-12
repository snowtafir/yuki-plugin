import Image from '../utils/image';
import { VersionProps } from '../components/version/Version';
import VersionData from '../models/version/version';
import { ScreenshotOptions } from '../utils/puppeteer.render';
import plugin from "../../../lib/plugins/plugin.js";

declare const segment: any;

export default class YukiVersion extends plugin {
  constructor() {
    super({
      name: "yuki-version",
      dsc: "优纪版本",
      event: "message",
      priority: 0,
      rule:[
        {
          reg: "^(#|\/)(yuki|优纪)版本$",
          fnc: "yukiVersion",
        },
      ]
    });
  };

  /**
   * 优纪版本
   */
  async yukiVersion() {
    const version = new VersionData;
    const versionData = await version.getChangelogContent();

    const renderData: VersionProps = {
      data: versionData.map((item: any) => ({
        version: item.version,
        data: item.data
      }))
    };
    const ScreenshotOptionsData: ScreenshotOptions = {
      isSplit: false,
      modelName: 'yukiVersion',
    };

    const helpImg = await Image.renderPage("version", "Version", renderData, ScreenshotOptionsData);

    let imgRes: { img: Buffer[]; }
    if (helpImg !== false) {
      const { img } = helpImg;
      imgRes = { img };
    } else {
      return;
    }
    let msg = [];
    msg.push(segment.image(imgRes.img[0]));
    await this.e.reply(msg);
  };
}
