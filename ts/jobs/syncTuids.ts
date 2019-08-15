import { Runner, packParam, Net } from '../core';
import { OpenApi } from '../core/openApi';

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
    switch (schema.type) {
        case 'tuid':
            await setTuid(runner, entity, unit, ret);
            break;
        case 'map':
            await setMap(runner, entity, unit, ret);
            break;
    }
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
