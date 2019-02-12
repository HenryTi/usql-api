import fetch from "node-fetch";
import { Fetch, centerApi, urlSetUqHost as urlSetUqHost, urlSetUnitxHost } from "../core";

export class OpenApi extends Fetch {
    async fresh(unit:number, stamps:any):Promise<any> {
        let ret = await this.post('open/fresh', {
            unit: unit,
            stamps: stamps
        });
        return ret;
    }
    async tuid(unit: number, id: number, tuid:string, maps: string[]):Promise<any> {
        let ret = await this.post('open/tuid', {
            unit: unit,
            id: id,
            tuid: tuid,
            maps: maps,
        });
        return ret;
    }
    async bus(unit:number, faces:string, faceUnitMessages:string) {
        let ret = await this.post('open/bus', {
            unit: unit,
            faces: faces,
            faceUnitMessages: faceUnitMessages,
        });
        return ret;
    }
}

const uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
export async function getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
    let openApis = uqOpenApis[uqFullName];
    if (openApis === null) return null;
    if (openApis === undefined) {
        uqOpenApis[uqFullName] = openApis = {};
    }
    let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
    if (uqUrl === undefined) return openApis[unit] = null;
    let {url, urlDebug} = uqUrl;
    if (urlDebug !== undefined) {
        try {
            urlDebug = urlSetUqHost(urlDebug);
            urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }
    return openApis[unit] = new OpenApi(url);
}
