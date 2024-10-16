import { EventType } from 'yunzaijs';
export default class Help {
    e?: EventType;
    model: string;
    constructor(e?: EventType);
    static get(e?: EventType): Promise<any[]>;
    getData(): Promise<any[]>;
}
