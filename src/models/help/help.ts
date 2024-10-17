import { EventType } from 'yunzaijs';
import Config from '@src/utils/config';

export default class Help {
  e?: EventType;
  model: string;
  constructor(e?: EventType) {
    this.model = 'help';
    this.e = e;
  }

  static async get(e?: EventType) {
    let helpData = new Help(e);
    return await helpData.getData();
  }

  async getData() {
    let helpData: Array<any> = Config.getDefaultConfig('help', 'help');
    return helpData;
  }
}
