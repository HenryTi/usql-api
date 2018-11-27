"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const core_1 = require("../core");
const db_1 = require("../db/db");
const db_2 = require("../db");
const packParam_1 = require("../core/packParam");
const dbRun = new db_1.Db(undefined);
function syncDbs() {
    return __awaiter(this, void 0, void 0, function* () {
        let dbs = yield dbRun.usqDbs();
        for (let row of dbs) {
            let { db } = row;
            if (db.substr(0, 1) === '$')
                continue;
            console.log('---- sync db: ' + db);
            yield syncFroms(db);
        }
        return;
    });
}
exports.syncDbs = syncDbs;
function syncFroms(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield db_2.getRunner(db);
        if (runner === undefined)
            return;
        let { froms } = runner;
        if (froms === undefined)
            return;
        try {
            let syncTuids = yield runner.call('$sync_tuids', []);
            let fromRows = {};
            for (let row of syncTuids) {
                let { from, unit, tuid } = row;
                let f = froms[from];
                if (f === undefined)
                    continue;
                let st = f[tuid];
                if (st === undefined)
                    continue;
                let unitRows = fromRows[from];
                if (unitRows === undefined)
                    fromRows[from] = unitRows = {};
                let rows = unitRows[unit];
                if (rows === undefined)
                    unitRows[unit] = rows = [];
                rows.push(row);
            }
            for (let from in fromRows) {
                let unitRows = fromRows[from];
                let fromSchemas = froms[from];
                for (let i in unitRows) {
                    let rows = unitRows[i];
                    let unit = Number(i);
                    let openApi = yield getOpenApi(from, unit);
                    let stamps = {};
                    for (let row of rows) {
                        let { tuid, id, hasNew, stamp } = row;
                        stamps[tuid] = stamp;
                        if (hasNew === 1) {
                            if (fromSchemas === undefined)
                                continue;
                            let syncTuid = fromSchemas[tuid];
                            let { maps } = syncTuid; // tuid, 随后 tab 分隔的 map
                            let ids = yield runner.call(tuid + '$sync0', [unit]);
                            for (let idRet of ids) {
                                yield syncId(runner, openApi, unit, idRet.id, tuid, maps);
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
    });
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
function syncId(runner, openApi, unit, id, tuid, maps) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('SyncId unit=' + unit + ' id=' + id + ' tuid=' + tuid);
        let ret = yield openApi.tuid(unit, id, tuid, maps);
        if (maps !== undefined) {
            for (let map of maps) {
                let mapValues = ret[map];
                if (mapValues === undefined)
                    continue;
                yield setMap(runner, map, unit, id, mapValues);
            }
        }
        yield setTuid(runner, tuid, unit, id, ret[tuid]);
    });
}
function setMap(runner, mapName, unit, id, values) {
    return __awaiter(this, void 0, void 0, function* () {
        let map = runner.getMap(mapName);
        if (map === undefined)
            return;
        let { actions } = map.call;
        let { sync } = actions;
        let data = {
            __id: id,
            arr1: values
        };
        let param = packParam_1.packParam(sync, data);
        yield runner.action(sync.name, unit, undefined, param);
        return;
    });
}
function setTuid(runner, tuidName, unit, id, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = undefined;
            let tuid = runner.getTuid(tuidName);
            let { id, fields, arrs } = tuid;
            let main = values[0][0];
            if (main === undefined)
                return;
            let idVal = main[id];
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    let arr = arrs[i];
                    let { name, fields } = arr;
                    let rows = values[i + 1];
                    for (let row of rows) {
                        let param = [idVal, row.id];
                        fields.forEach(v => param.push(row[v.name]));
                        param.push(row.$order);
                        yield runner.tuidArrSave(tuidName, name, unit, user, param);
                    }
                }
            }
            let paramMain = [idVal];
            fields.forEach(v => paramMain.push(main[v.name]));
            paramMain.push(main.$stamp);
            yield runner.tuidSave(tuidName, unit, user, paramMain);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
class OpenApi extends core_1.Fetch {
    fresh(unit, stamps) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/fresh', {
                unit: unit,
                stamps: stamps
            });
            return ret;
        });
    }
    tuid(unit, id, tuid, maps) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/tuid', {
                unit: unit,
                id: id,
                tuid: tuid,
                maps: maps,
            });
            return ret;
        });
    }
}
const usqOpenApis = {};
function getOpenApi(usqFullName, unit) {
    return __awaiter(this, void 0, void 0, function* () {
        let openApis = usqOpenApis[usqFullName];
        if (openApis === null)
            return null;
        if (openApis === undefined) {
            usqOpenApis[usqFullName] = openApis = {};
        }
        let usqUrl = yield core_1.centerApi.urlFromUsq(unit, usqFullName);
        if (usqUrl === undefined)
            return openApis[unit] = null;
        let { url, urlDebug } = usqUrl;
        if (urlDebug !== undefined) {
            try {
                urlDebug = core_1.urlSetUsqHost(urlDebug);
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        return openApis[unit] = new OpenApi(url);
    });
}
//# sourceMappingURL=open.js.map