import Config from '../../utils/config.js';

//import { EventType } from 'yunzai';
class Help {
    e;
    model;
    constructor(e) {
        this.model = 'help';
        this.e = e;
    }
    static async get(e) {
        let helpData = new Help(e);
        return await helpData.getData();
    }
    async getData() {
        let helpData = Config.getDefaultConfig('help', 'help');
        return helpData;
    }
}

export { Help as default };
