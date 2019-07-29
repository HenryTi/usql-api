//import fetch from "node-fetch";
import { Fetch } from ".";

interface QueueModify {
    queue: {id:number, entity:string, key:string}[];
    queueMax: number;
}

export class OpenApi extends Fetch {
    async fresh(unit:number, stamps:any):Promise<any> {
        let ret = await this.post('open/fresh', {
            unit: unit,
            stamps: stamps
        });
        return ret;
    }
    async fromEntity(unit: number|string, entity:string, key: string):Promise<any> {
        let ret = await this.post('open/from-entity', {
            unit: unit,
            entity: entity,
            key: key,
        });
        return ret;
    }
    async queueModify(unit:number|string, start:number, page:number, entities:string):Promise<QueueModify> {
        if (start === undefined || start === null) start = 0;
        let ret = await this.post('open/queue-modify', {
            unit: unit,
            start: start,
            page: page,
            entities: entities,
        });
        return ret;
    }
}

/*
const uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
export async function getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
    let openApis = uqOpenApis[uqFullName];
    if (openApis === null) return null;
    if (openApis !== undefined) {
        let ret = openApis[unit];
        if (ret === null) return null;
        if (ret !== undefined) return ret;
    }
    
    uqOpenApis[uqFullName] = openApis = {};
    let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
    if (uqUrl === undefined) return openApis[unit] = null;
    let {url, urlDebug} = uqUrl;
    if (urlDebug) {
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
*/