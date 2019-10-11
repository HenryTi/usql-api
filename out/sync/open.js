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
const core_1 = require("../core");
const db_1 = require("../db/db");
const db_2 = require("../db");
const openApi_1 = require("./openApi");
const bus_1 = require("./bus");
const dbRun = new db_1.Db(undefined);
function syncDbs() {
    return __awaiter(this, void 0, void 0, function* () {
        let dbs = yield dbRun.uqDbs();
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
        yield syncTuids(runner);
        yield bus_1.syncBus(runner);
    });
}
function syncTuids(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let { froms } = runner;
        if (froms === undefined)
            return;
        try {
            let syncTuids = yield runner.call('$sync_tuids', []);
            if (syncTuids.length === 0)
                return;
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
                    let openApi = yield openApi_1.getOpenApi(from, unit);
                    if (!openApi)
                        continue;
                    let stamps = [];
                    // 如果本tuid有新id了，去from端同步
                    for (let row of rows) {
                        let { tuid, id, hasNew, stamp } = row;
                        if (stamp === null)
                            stamp = 0;
                        if (id === null)
                            id = 0;
                        let tuidSchema = runner.getTuid(tuid);
                        // 只有import from all的tuid才同步
                        if (tuidSchema.from.all === true) {
                            stamps.push([tuid, stamp, id]);
                        }
                        if (hasNew === 1) {
                            if (fromSchemas === undefined)
                                continue;
                            let syncTuid = fromSchemas[tuid];
                            let { maps } = syncTuid; // tuid, 随后 tab 分隔的 map
                            try {
                                for (;;) {
                                    let ids = yield runner.unitCall(tuid + '$sync0', unit);
                                    if (ids.length === 0)
                                        break;
                                    for (let idRet of ids) {
                                        yield syncId(runner, openApi, unit, idRet.id, tuid, maps);
                                    }
                                }
                                yield runner.unitUserCall(tuid + '$sync_set', unit, undefined, undefined, 0);
                            }
                            catch (err) {
                                debugger;
                            }
                            let s = null;
                        }
                    }
                    if (stamps.length === 0)
                        continue;
                    // 如果from端更新了tuid，同步过来。
                    let fresh = yield openApi.fresh(unit, stamps);
                    let len = stamps.length;
                    for (let i = 0; i < len; i++) {
                        let stampRow = stamps[i];
                        let tuid = stampRow[0];
                        let syncTuid = fromSchemas[tuid];
                        let { maps } = syncTuid; // tuid, 随后 tab 分隔的 map
                        let tuidIdTable;
                        if (len === 1) {
                            tuidIdTable = fresh;
                        }
                        else {
                            tuidIdTable = fresh[i];
                        }
                        let stampMax = 0;
                        try {
                            for (let row of tuidIdTable) {
                                let { id, stamp } = row;
                                yield syncId(runner, openApi, unit, id, tuid, maps);
                                if (stamp > stampMax)
                                    stampMax = stamp;
                                yield runner.unitCall(tuid + '$sync_set', unit, stampMax, id, undefined);
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
            if (err && err.message)
                console.error(err.message);
        }
    });
}
function syncId(runner, openApi, unit, id, tuid, maps) {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = yield openApi.tuid(unit, id, tuid, maps);
        if (ret === undefined)
            return;
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
        let param = core_1.packParam(sync, data);
        yield runner.action(sync.name, unit, undefined, param);
        return;
    });
}
function setTuid(runner, tuidName, unit, id, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = undefined;
            let tuid = runner.getTuid(tuidName);
            let { id: idFieldName, fields, arrs } = tuid;
            let main = values[0];
            if (Array.isArray(main))
                main = main[0];
            if (main === undefined) {
                yield runner.tuidSetStamp(tuidName, unit, [id, -2]);
                return;
            }
            let idVal = main[idFieldName];
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
//# sourceMappingURL=open.js.map