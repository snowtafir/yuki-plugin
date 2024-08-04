//import { EventType } from 'yunzai';
import Config from '../../utils/config';

export default class Help {
  e?: any;
  model: string;
  constructor(e?: any) {
    this.model = "help";
    this.e = e
  }

  static async get(e?: any) {
    let helpData = new Help(e);
    return await helpData.getData();
  }

  async getData() {
    let helpData: Array<any> = Config.getDefaultConfig("help", "help");
    return helpData;
  }
}
