import fetch from 'node-fetch';
import { centerApi, Fetch, urlSetUsqHost, packParam, urlSetUnitxHost, consts } from '../core';
import { Db } from '../db/db';
import { getRunner, Runner } from '../db';

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
                let stamps:any[][] = [];
                for (let row of rows) {
                    let {tuid, id, hasNew, stamp} = row;
                    stamps.push([tuid, stamp, id]);
                    if (hasNew === 1) {
                        if (fromSchemas === undefined) continue;
                        let syncTuid = fromSchemas[tuid];
                        let {maps} = syncTuid; // tuid, 随后 tab 分隔的 map
                        for (;;) {
                            let ids = await runner.call(tuid + '$sync0', [unit]);
                            if (ids.length === 0) break;
                            for (let idRet of ids) {
                                await syncId(runner, openApi, unit, idRet.id, tuid, maps);
                            }
                        }
                        await runner.call(tuid + '$sync_set', [unit, undefined, undefined, 0]);
                    }
                }
                let fresh = await openApi.fresh(unit, stamps);
                let len = stamps.length;
                for (let i=0; i<len; i++) {
                    let stampRow = stamps[i];
                    let tuid = stampRow[0];
                    let syncTuid = fromSchemas[tuid];
                    let {maps} = syncTuid; // tuid, 随后 tab 分隔的 map
                    let tuidIdTable = fresh[i];
                    let stampMax = 0;
                    for (let row of tuidIdTable) {
                        let {id, stamp} = row;
                        await syncId(runner, openApi, unit, id, tuid, maps);
                        if (stamp > stampMax) stampMax = stamp;
                        await runner.call(tuid + '$sync_set', [unit, stampMax, id, undefined]);
                    }
                    let s = null;
                }
            }
        }

        await syncBus(runner);
    }
    catch (err) {
        debugger;
        if (err && err.message) console.error(err.message);
    }
}

async function syncId(runner:Runner, openApi:OpenApi, unit:number, id:number, tuid:string, maps:string[]) {
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
        let {id:idFieldName, fields, arrs} = tuid;
        let main = values[0][0];
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

interface SyncFace {
    unit: number;
    faces: string;
    faceUnitMessages: string;
}

interface Face {
    bus: string;
    faceUrl: string;
    face: string;
}

interface SyncFaces {
    faceColl: {[id:number]: Face};
    syncFaceArr: SyncFace[];
}

async function syncBus(runner: Runner) {
    /*
    let unit = 27;
    let faces = '11\ta/b/c\n33\tb';
    let faceUnitMessages = '11\t27\t428799000000003\n33\t27\t330343442';
    let syncFaces = await runner.call('$sync_faces', []);
    */
    let syncFaces = await getSyncFaces(runner);
    if (syncFaces === undefined) return;
    let {faceColl, syncFaceArr} = syncFaces;
    for (let syncFace of syncFaceArr) {
        let {unit, faces, faceUnitMessages} = syncFace;
        let openApi = await getOpenApi(consts.$$$unitx, unit);
        let ret = await openApi.bus(faces, faceUnitMessages);
        if (ret.length === 0) break;
        for (let row of ret) {
            let {face:faceId, id:msgId, body} = row;
            let {bus, faceUrl, face} = faceColl[faceId];
            await runner.bus(bus, face, unit, faceId, msgId, body);
        }
    }
}

async function getSyncFaces(runner: Runner): Promise<SyncFaces> {
    let syncFaces = await runner.call('$sync_faces', []);
    let arr0:any[] = syncFaces[0];
    let arr1:any[] = syncFaces[1];
    if (arr0.length === 0) return;
    let faceColl: {[id:number]: Face} = {};
    let faceArr:string[] = arr0.map(v => {
        let {id, bus, busOwner, busName, faceName} = v;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        faceColl[id] = {bus:bus, faceUrl:faceUrl, face:faceName};
        return `${id}\t${faceUrl}`;
    });

    let unitFaceMsgs:{[unit:number]: {face:number;msgId:number}[]} = {};
    for (let row of arr1) {
        let {face, unit, msgId} = row;
        let faceMsgs:{face:number;msgId:number}[] = unitFaceMsgs[unit];
        if (faceMsgs === undefined) {
            unitFaceMsgs[unit] = faceMsgs = [];
        }
        faceMsgs.push({face:face, msgId:msgId});
    }

    let faces = faceArr.join('\n');
    let syncFaceArr: SyncFace[] = [];
    let ret:SyncFaces = {
        faceColl: faceColl,
        syncFaceArr: syncFaceArr
    };
    for (let unit in unitFaceMsgs) {
        let faceMsgs = unitFaceMsgs[unit];
        let msgArr:string[] = faceMsgs.map(v => {
            let {face, msgId} = v;
            if (msgId === null) msgId = 0;
            return `${face}\t${unit}\t${msgId}`;
        });
        syncFaceArr.push({unit:Number(unit), faces:faces, faceUnitMessages: msgArr.join('\n')});
    }
    return ret;
}

class OpenApi extends Fetch {
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
    async bus(faces:string, faceUnitMessages:string) {
        let ret = await this.post('open/bus', {
            faces: faces,
            faceUnitMessages: faceUnitMessages,
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
