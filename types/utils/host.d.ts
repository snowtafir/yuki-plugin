type HostType = 'yunzaijs' | 'trss' | 'miao' | 'other';
declare let Plugin: any, Segment: any, Redis: any;
declare const hostType: HostType;
declare const logger: any;
export { hostType, logger, Plugin, Redis, Segment };
