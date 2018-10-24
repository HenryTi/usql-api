/*
import * as config from 'config';
import {Fetch} from '../core/fetch';
import { processSheetMessage } from '../unitx-server/processSheetMessage';
import { queueUnitx } from '../unitx-server/unitxQueue';

const unitxHost = config.get<string>('unitxhost');
export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}

const localhosts = [
    'localhost',
    '127.0.0.1'
];
export class UnitxApi extends Fetch {
    private isLocalHost:boolean;

    constructor(baseUrl:string) {
        super(baseUrl);
        let lh = localhosts.find(v => baseUrl.indexOf('://'+v+':')>=0) != undefined;
        this.isLocalHost = lh;
    }

    async sheet(msg: any):Promise<number[]> {
        let ret:number[];
        if (this.isLocalHost === true) {
            let {$unit} = msg;
            ret = await processSheetMessage($unit, msg);
        }
        else {
            ret = await this.post('unitx/sheet', msg);
        }

        return ret;
    }
    async bus(msg: any):Promise<any> {
        let ret;
        if (this.isLocalHost === true) {
            ret = await queueUnitx(msg);
        }
        else {
            ret = await this.post('unitx/bus', msg);
        }
        return ret;
    }
}
*/