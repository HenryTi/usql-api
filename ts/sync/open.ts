import { packParam } from '../core';
import { Db } from '../db/db';
import { getRunner, Runner } from '../db';
import { getOpenApi, OpenApi } from './openApi';
import { syncBus } from './bus';

const dbRun = new Db(undefined);

export async function syncDbs():Promise<void> {
    let dbs = await dbRun.uqDbs();
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
    await syncTuids(runner);
    await syncBus(runner);
}

async function syncTuids(runner:Runner):Promise<void> {
    let {froms} = runner;
    if (froms === undefined) return;
    try {
        let syncTuids = await runner.call('$sync_tuids', []);
        if (syncTuids.length === 0) return;
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
                if (!openApi) continue;
                let stamps:any[][] = [];
                // 如果本tuid有新id了，去from端同步
                for (let row of rows) {
                    let {tuid, id, hasNew, stamp} = row;
                    if (stamp === null) stamp = 0;
                    if (id === null) id = 0;
                    let tuidSchema = runner.getTuid(tuid);
                    // 只有import from all的tuid才同步
                    if (tuidSchema.from.all === true) {
                        stamps.push([tuid, stamp, id]);
                    }
                    if (hasNew === 1) {
                        if (fromSchemas === undefined) continue;
                        let syncTuid = fromSchemas[tuid];
                        let {maps} = syncTuid; // tuid, 随后 tab 分隔的 map
                        try {
                            for (;;) {
                                let ids = await runner.call(tuid + '$sync0', [unit]);
                                if (ids.length === 0) break;
                                for (let idRet of ids) {
                                    await syncId(runner, openApi, unit, idRet.id, tuid, maps);
                                }
                            }
                            await runner.call(tuid + '$sync_set', [unit, undefined, undefined, 0]);
                        }
                        catch (err) {
                            debugger;
                        }
                        let s = null;
                    }
                }
                if (stamps.length === 0) continue;
                // 如果from端更新了tuid，同步过来。
                let fresh = await openApi.fresh(unit, stamps);
                let len = stamps.length;
                for (let i=0; i<len; i++) {
                    let stampRow = stamps[i];
                    let tuid = stampRow[0];
                    let syncTuid = fromSchemas[tuid];
                    let {maps} = syncTuid; // tuid, 随后 tab 分隔的 map
                    let tuidIdTable:any[];

                    if (len === 1) {
                        tuidIdTable = fresh;
                    }
                    else {
                        tuidIdTable = fresh[i];
                    }
                    let stampMax = 0;
                    try {
                        for (let row of tuidIdTable) {
                            let {id, stamp} = row;
                            await syncId(runner, openApi, unit, id, tuid, maps);
                            if (stamp > stampMax) stampMax = stamp;
                            await runner.call(tuid + '$sync_set', [unit, stampMax, id, undefined]);
                        }
                    }
                    catch (err) {
                        debugger;
                    }
                    let s = null;
                }
            }
        }
    }
    catch (err) {
        debugger;
        if (err && err.message) console.error(err.message);
    }
}

async function syncId(runner:Runner, openApi:OpenApi, unit:number, id:number, tuid:string, maps:string[]) {
    let ret = await openApi.tuid(unit, id, tuid, maps);
    if (ret === undefined) return;
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
        let {id:idFieldName, fields, arrs} = tuid;
        let main = values[0];
        if (Array.isArray(main)) main = main[0];
        if (main === undefined) {
            await runner.tuidSetStamp(tuidName, unit, [id, -2]);
            return;
        }
        let idVal = main[idFieldName];
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
