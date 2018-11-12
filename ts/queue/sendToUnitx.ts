import * as config from 'config';
import fetch from 'node-fetch';
import { centerApi, Fetch } from '../core';
import { Message } from './model';

export async function sendToUnitx(unit:number, msg:Message):Promise<number[]> {
    let unitxApi = await getUnitxApi(unit);
    if (unitxApi === null) {
        console.log('unit %s not have unitx', unit);
        return;
    }
    let toArr:number[] = await unitxApi.send(msg);
    return toArr;
}

const unitxHost = config.get<string>('unitxhost');
function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}

class UnitxApi extends Fetch {
    async send(msg: any):Promise<number[]> {
        let ret:number[] = await this.post('unitx', msg);
        return ret;
    }
}

const unitxApis: {[unit:number]:UnitxApi} = {};
async function getUnitxApi(unit:number):Promise<UnitxApi> {
    let unitxApi = unitxApis[unit];
    if (unitxApi === null) return null;
    if (unitxApi !== undefined) return unitxApi;
    let unitx = await centerApi.unitx(unit);
    if (unitx === undefined) return unitxApis[unit] = null;
    let {url, urlDebug} = unitx;
    if (urlDebug !== undefined) {
        try {
            urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }
    return unitxApis[unit] = new UnitxApi(url);
}
