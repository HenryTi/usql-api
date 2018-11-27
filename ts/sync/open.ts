import * as config from 'config';
import fetch from 'node-fetch';
import { centerApi, Fetch, urlSetUsqHost } from '../core';
import { Db } from '../db/db';
import { getRunner, Runner } from '../db';
import { packParam } from '../core/packParam';

const dbRun = new Db(undefined);

export async function syncDbs():Promise<void> {
    let dbs = await dbRun.usqDbs();
    for (let row of dbs) {
        let {db} = row;
        if ((db as string).substr(0, 1) === '$') continue;
        console.log('---- sync db: ' + db);
        await syncFroms(db);
    }
    return;
}

interface SyncRow {
    unit: number;
    from: string;
    tuid: string;
    id: number;
    hasNew: number;
    stamp: number;
}

async function syncFroms(db:string):Promise<void> {
    let runner = await getRunner(db);
    if (runner === undefined) return;
    let {froms} = runner;
    if (froms === undefined) return;
    try {
        let syncTuids = await runner.call('$sync_tuids', []);
        let fromRows: {[from:string]: {[unit:number]: SyncRow[]}} = {};
        for (let row of syncTuids) {
            let {from, unit, tuid} = row as SyncRow;
            let f = froms[from];
            if (f === undefined) continue;
            let st = f[tuid];
            if (st === undefined) continue;
            let unitRows = fromRows[from];
            if (unitRows === undefined) fromRows[from] = unitRows = {};
            let rows = unitRows[unit];
            if (rows === undefined) unitRows[unit] = rows = [];
            rows.push(row);
        }

        for (let from in fromRows) {
            let unitRows = fromRows[from];
            let fromSchemas = froms[from];
            for (let i in unitRows) {
                let rows = unitRows[i];
                let unit = Number(i);
                let openApi = await getOpenApi(from, unit);
                let stamps:{[tuid:string]:number} = {};
                for (let row of rows) {
                    let {tuid, id, hasNew, stamp} = row;
                    stamps[tuid] = stamp;
                    if (hasNew === 1) {
                        if (fromSchemas === undefined) continue;
                        let syncTuid = fromSchemas[tuid];
                        let {maps} = syncTuid; // tuid, 随后 tab 分隔的 map
                        let ids = await runner.call(tuid + '$sync0', [unit]);
                        for (let idRet of ids) {
                            await syncId(runner, openApi, unit, idRet.id, tuid, maps);
                        }
                    }
                }
                let str = '';
                //let fresh = await openApi.fresh(unit, /*stamps*/str);
            }
        }

        /*
        let fromStamps:{[from:string]: {[tuid:string]:number}} = {};
        for (let row of syncTuids) {
            let {unit, from, tuid:t, id, hasNew, stamp} = row;
            let f = froms[from];
            if (f === undefined) continue;
            let st = f[t];
            if (st === undefined) continue;
            let {tuid, maps} = st;
            let stamps = fromStamps[from];
            if (stamps === undefined) stamps = fromStamps[from] = {};
            stamps[tuid.name] = stamp;
            if (hasNew === 1) {
                await syncId(runner, unit, id, from, tuid, maps);
            }
        }
        */
    }
    catch (err) {
        console.error(err.message);
    }
}

/*
async function syncTuid(runner:Runner, unit:number, from:string, tuid:any, maps:{[map:string]:any}, hasNew:number, stamp:number) {
    if (hasNew === 1) {
        let newIds = await runner.call(tuid.name + '$sync0', [unit]);
        for (let row of newIds) {
            let {id} = row;
            await syncId(runner, unit, id, from, tuid, maps);
        }
    }
}
*/

async function syncId(runner:Runner, openApi:OpenApi, unit:number, id:number, tuid:string, maps:string[]) {
    console.log('SyncId unit=' + unit + ' id=' + id + ' tuid=' + tuid);
    let ret = await openApi.tuid(unit, id, tuid, maps);
    if (maps !== undefined) {
        for (let map of maps) {
            let mapValues = ret[map];
            if (mapValues === undefined) continue;
            await setMap(runner, map, unit, id, mapValues);
        }
    }
    await setTuid(runner, tuid, unit, id, ret[tuid]);
}

async function setMap(runner:Runner, mapName:string, unit:number, id:number, values:any[]) {
    let map = runner.getMap(mapName);
    if (map === undefined) return;
    let {actions} = map.call;
    let {sync} = actions;
    let data = {
        __id: id,
        arr1: values
    }
    let param = packParam(sync, data);
    await runner.action(sync.name, unit, undefined, param);
    return;
}

async function setTuid(runner:Runner, tuidName:string, unit:number, id:number, values:any) {
    try {
        let user = undefined;
        let tuid = runner.getTuid(tuidName);
        let {id, fields, arrs} = tuid;
        let main = values[0][0];
        if (main === undefined) return;
        let idVal = main[id];
        if (arrs !== undefined) {
            let len = arrs.length;
            for (let i=0; i<len; i++) {
                let arr = arrs[i];
                let {name, fields} = arr;
                let rows = values[i+1] as any[];
                for (let row of rows) {
                    let param = [idVal, row.id];
                    (fields as any[]).forEach(v => param.push(row[v.name]));
                    param.push(row.$order);
                    await runner.tuidArrSave(tuidName, name, unit, user, param);
                }
            }
        }
        let paramMain:any[] = [idVal];
        (fields as any[]).forEach(v => paramMain.push(main[v.name]));
        paramMain.push(main.$stamp);
        await runner.tuidSave(tuidName, unit, user, paramMain);
    }
    catch (err) {
        console.log(err.message);
    }
}

class OpenApi extends Fetch {
    async fresh(unit:number, stamps:string):Promise<any> {
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
}

const usqOpenApis: {[usqFullName:string]: {[unit:number]:OpenApi}} = {};
async function getOpenApi(usqFullName:string, unit:number):Promise<OpenApi> {
    let openApis = usqOpenApis[usqFullName];
    if (openApis === null) return null;
    if (openApis === undefined) {
        usqOpenApis[usqFullName] = openApis = {};
    }
    let usqUrl = await centerApi.urlFromUsq(unit, usqFullName);
    if (usqUrl === undefined) return openApis[unit] = null;
    let {url, urlDebug} = usqUrl;
    if (urlDebug !== undefined) {
        try {
            urlDebug = urlSetUsqHost(urlDebug);
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
