import { Runner, packParam, Net } from '../core';
import { OpenApi } from '../core/openApi';

interface SyncRow {
    unit: number;
    from: string;
    tuid: string;
    id: number;
    hasNew: number;
    stamp: number;
}

export async function syncTuids(runner:Runner, net:Net):Promise<void> {
    let {froms, hasSyncTuids} = runner;
    if (hasSyncTuids === false) return;
    if (froms === undefined) return;
    try {
        let db = runner.getDb();
        let uqs = ['order', 'salestask'];
        if (uqs.indexOf(db) < 0) return;
        await syncNew(runner, net);
        await syncModify(runner, net);
        /*
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
                let openApi = await net.getOpenApi(from, unit);
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
                                let ids = await runner.unitCall(tuid + '$sync0', unit);
                                if (ids.length === 0) break;
                                for (let idRet of ids) {
                                    await syncId(runner, openApi, unit, idRet.id, tuid, maps);
                                }
                            }
                            await runner.unitUserCall(tuid + '$sync_set', unit, undefined, undefined, 0);
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
                        if (tuidIdTable !== undefined) {
                            for (let row of tuidIdTable) {
                                let {id, stamp} = row;
                                await syncId(runner, openApi, unit, id, tuid, maps);
                                if (stamp > stampMax) stampMax = stamp;
                                await runner.unitCall(tuid + '$sync_set', unit, stampMax, id, undefined);
                            }
                        }
                    }
                    catch (err) {
                        debugger;
                    }
                    let s = null;
                }
            }
        }
        */
    }
    catch (err) {
        debugger;
        if (err && err.message) console.error(err.message);
    }
}

async function syncNew(runner:Runner, net:Net) {
    for (;;) {
        let items = await runner.tableFromProc('$from_new', []);
        if (items.length === 0) {
            break;
        }
        for (let item of items) {
            let {id, unit, entity, key} = item;
            if (unit === undefined) unit = runner.uniqueUnit;
            let schema = runner.getSchema(entity);
            if (schema === undefined) continue;
            let {from} = schema;
            let openApi = await net.openApiUnitUq(unit, from);
            if (!openApi) continue;
            /*
            let ret = await openApi.fromEntity(unit, entity, key);
            if (type === 'tuid') {
                await setTuid(runner, entity, unit, id, ret);
            }
            else if (type === 'map') {
                await setMap(runner, entity, unit, id, ret);
            }
            */
            await syncEntity(runner, openApi, unit, entity, key);
            await runner.call('$from_new_finished', [unit, id]);
        }
    }
}

interface OpenApiItem {
    openApi: OpenApi;
    entities: string[];
    modifyMax: number;
}
interface UnitOpenApiItems {
    [unit:number]:OpenApiItem[];
}

async function syncModify(runner:Runner, net:Net) {
    let items = await runner.tableFromProc('$sync_from', []);
    if (items.length === 0) return;
    let unitOpenApiItems:UnitOpenApiItems = {};
    // 把访问同一个openApi的整理到一起
    let promises:Promise<OpenApi>[] = [];
    let params:{from:any, unit:any, modifyMax:number, entity:string}[] = [];
    for (let item of items) {
        let {unit, entity, modifyMax} = item;
        if (!unit) unit = runner.uniqueUnit;
        let schema = runner.getSchema(entity);
        if (schema === undefined) debugger;
        let {type, from} = schema;
        let openApiPromise = net.openApiUnitUq(unit, from);
        promises.push(openApiPromise);
        params.push({from:from, unit:unit, modifyMax:modifyMax, entity:entity});
    }
    let openApis = await Promise.all(promises);
    let len = openApis.length;
    for (let i=0; i<len; i++) {
        let openApi = openApis[i];
        if (!openApi) continue;
        let {from, unit, modifyMax, entity} = params[i];
        let openApiItems = unitOpenApiItems[unit];
        if (openApiItems === undefined) {
            unitOpenApiItems[unit] = openApiItems = [{
                openApi: openApi, 
                entities:[entity], 
                modifyMax: modifyMax
            }];
        }
        else {
            let openApiItem = openApiItems.find(v => v.openApi === openApi);
            if (openApiItem === undefined) {
                openApiItems.push({
                    openApi:openApi, 
                    entities:[entity],
                    modifyMax: modifyMax,
                });
            }
            else {
                openApiItem.entities.push(entity);
                if (modifyMax > openApiItem.modifyMax) {
                    openApiItem.modifyMax = modifyMax;
                }
            }
        }
    }

    // 从from uq获取数据
    let page = 100;
    for (let unit in unitOpenApiItems) {
        let openApiItems = unitOpenApiItems[unit];
        for (let openApiItem of openApiItems) {
            try {
                let {openApi, entities, modifyMax} = openApiItem;
                let ret = await openApi.queueModify(unit, modifyMax, page, entities.join('\t'), );
                let {queue, queueMax} = ret;
                for (let item of queue) {
                    let {id, entity, key} = item;
                    await syncEntity(runner, openApi, unit, entity, key);
                    await runner.call('$sync_from_set', [unit, entity, id]);
                }
                if (queue.length < page && modifyMax<queueMax) {
                    for (let item of queue) {
                        let {entity} = item;
                        await runner.call('$sync_from_set', [unit, entity, queueMax]);
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
        }
    }
}

async function syncEntity(runner:Runner, openApi:OpenApi, unit:number|string, entity:string, key:string) {
    let ret = await openApi.fromEntity(unit, entity, key);
    let schema = runner.getSchema(entity);
    let {type} = schema;
    if (type === 'tuid') {
        await setTuid(runner, entity, unit, /*id, */ret);
    }
    else if (type === 'map') {
        await setMap(runner, entity, unit, /*id, */ret);
    }
}

async function syncId(runner:Runner, openApi:OpenApi, unit:number, id:number, tuid:string, maps:string[]) {
    let ret = undefined; //await openApi.tuid(unit, id, tuid, maps);
    if (ret === undefined) return;
    if (maps !== undefined) {
        for (let map of maps) {
            let mapValues = ret[map];
            if (mapValues === undefined) continue;
            await setMap(runner, map, unit, /*id, */mapValues);
        }
    }
    await setTuid(runner, tuid, unit, /*id, */ret[tuid]);
}

async function setMap(runner:Runner, mapName:string, unit:number|string, /*id:number, */values:any[]) {
    let map = runner.getMap(mapName);
    if (map === undefined) return;
    let {actions} = map.call;
    let {sync} = actions;
    let data = {
        //__id: id,
        arr1: values
    }
    let param = packParam(sync, data);
    await runner.action(sync.name, unit as any, undefined, param);
    return;
}

async function setTuid(runner:Runner, tuidName:string, unit:number|string, /*id:number, */values:any) {
    try {
        let user = undefined;
        let tuid = runner.getTuid(tuidName);
        let {id:idFieldName, fields, arrs} = tuid;
        let main = values[0];
        if (Array.isArray(main)) main = main[0];
        if (main === undefined) {
            //await runner.tuidSetStamp(tuidName, unit, [id, -2]);
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
                    await runner.tuidArrSave(tuidName, name, unit as any, user, param);
                }
            }
        }
        let paramMain:any[] = [idVal];
        (fields as any[]).forEach(v => paramMain.push(main[v.name]));
        paramMain.push(main.$stamp);
        await runner.tuidSave(tuidName, unit as any, user, paramMain);
    }
    catch (err) {
        console.log(err.message);
    }
}
