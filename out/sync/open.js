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
                    let stamps = [];
                    for (let row of rows) {
                        let { tuid, id, hasNew, stamp } = row;
                        stamps.push([tuid, stamp, id]);
                        if (hasNew === 1) {
                            if (fromSchemas === undefined)
                                continue;
                            let syncTuid = fromSchemas[tuid];
                            let { maps } = syncTuid; // tuid, 随后 tab 分隔的 map
                            for (;;) {
                                let ids = yield runner.call(tuid + '$sync0', [unit]);
                                if (ids.length === 0)
                                    break;
                                for (let idRet of ids) {
                                    yield syncId(runner, openApi, unit, idRet.id, tuid, maps);
                                }
                            }
                            yield runner.call(tuid + '$sync_set', [unit, undefined, undefined, 0]);
                        }
                    }
                    let fresh = yield openApi.fresh(unit, stamps);
                    let len = stamps.length;
                    for (let i = 0; i < len; i++) {
                        let stampRow = stamps[i];
                        let tuid = stampRow[0];
                        let syncTuid = fromSchemas[tuid];
                        let { maps } = syncTuid; // tuid, 随后 tab 分隔的 map
                        let tuidIdTable = fresh[i];
                        let stampMax = 0;
                        for (let row of tuidIdTable) {
                            let { id, stamp } = row;
                            yield syncId(runner, openApi, unit, id, tuid, maps);
                            if (stamp > stampMax)
                                stampMax = stamp;
                            yield runner.call(tuid + '$sync_set', [unit, stampMax, id, undefined]);
                        }
                        let s = null;
                    }
                }
            }
            yield syncBus(runner);
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
            let main = values[0][0];
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
function syncBus(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        let unit = 27;
        let faces = '11\ta/b/c\n33\tb';
        let faceUnitMessages = '11\t27\t428799000000003\n33\t27\t330343442';
        let syncFaces = await runner.call('$sync_faces', []);
        */
        let syncFaces = yield getSyncFaces(runner);
        if (syncFaces === undefined)
            return;
        let { faceColl, syncFaceArr } = syncFaces;
        for (let syncFace of syncFaceArr) {
            let { unit, faces, faceUnitMessages } = syncFace;
            let openApi = yield getOpenApi(core_1.consts.$$$unitx, unit);
            let ret = yield openApi.bus(faces, faceUnitMessages);
            if (ret.length === 0)
                break;
            for (let row of ret) {
                let { face: faceId, id: msgId, body } = row;
                let { bus, faceUrl, face } = faceColl[faceId];
                yield runner.bus(bus, face, unit, faceId, msgId, body);
            }
        }
    });
}
function getSyncFaces(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let syncFaces = yield runner.call('$sync_faces', []);
        let arr0 = syncFaces[0];
        let arr1 = syncFaces[1];
        if (arr0.length === 0)
            return;
        let faceColl = {};
        let faceArr = arr0.map(v => {
            let { id, bus, busOwner, busName, faceName } = v;
            let faceUrl = `${busOwner}/${busName}/${faceName}`;
            faceColl[id] = { bus: bus, faceUrl: faceUrl, face: faceName };
            return `${id}\t${faceUrl}`;
        });
        let unitFaceMsgs = {};
        for (let row of arr1) {
            let { face, unit, msgId } = row;
            let faceMsgs = unitFaceMsgs[unit];
            if (faceMsgs === undefined) {
                unitFaceMsgs[unit] = faceMsgs = [];
            }
            faceMsgs.push({ face: face, msgId: msgId });
        }
        let faces = faceArr.join('\n');
        let syncFaceArr = [];
        let ret = {
            faceColl: faceColl,
            syncFaceArr: syncFaceArr
        };
        for (let unit in unitFaceMsgs) {
            let faceMsgs = unitFaceMsgs[unit];
            let msgArr = faceMsgs.map(v => {
                let { face, msgId } = v;
                if (msgId === null)
                    msgId = 0;
                return `${face}\t${unit}\t${msgId}`;
            });
            syncFaceArr.push({ unit: Number(unit), faces: faces, faceUnitMessages: msgArr.join('\n') });
        }
        return ret;
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
    bus(faces, faceUnitMessages) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/bus', {
                faces: faces,
                faceUnitMessages: faceUnitMessages,
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
                urlDebug = core_1.urlSetUnitxHost(urlDebug);
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