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
const _ = require("lodash");
const db_1 = require("./db");
const packReturn_1 = require("../core/packReturn");
const importData_1 = require("./importData");
const runners = {};
function getRunner(name) {
    return __awaiter(this, void 0, void 0, function* () {
        name = name.toLowerCase();
        let runner = runners[name];
        if (runner === null)
            return;
        if (runner === undefined) {
            let db = db_1.getDb(name);
            let isExists = yield db.exists();
            if (isExists === false) {
                runners[name] = null;
                return;
            }
            runner = new Runner(db);
            runners[name] = runner;
        }
        yield runner.init();
        return runner;
    });
}
exports.getRunner = getRunner;
class Runner {
    constructor(db) {
        this.db = db;
        this.setting = {};
    }
    getDb() { return this.db.getDbName(); }
    sql(sql, params) {
        return this.db.sql(sql, params);
    }
    procCall(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call(proc, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + proc, params);
        });
    }
    createDatabase() {
        return this.db.createDatabase();
    }
    setTimezone(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$set_timezone', [unit, user]);
        });
    }
    start(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$start', [unit, user]);
        });
    }
    initResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.initResDb(resDbName);
        });
    }
    setSetting(unit, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            yield this.db.call('tv_$set_setting', [unit, name, value]);
            if (unit === 0) {
                let n = Number(value);
                this.setting[name] = n === NaN ? value : n;
            }
        });
    }
    getSetting(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            let ret = yield this.db.tableFromProc('tv_$get_setting', [unit, name]);
            if (ret.length === 0)
                return undefined;
            let v = ret[0].value;
            if (unit === 0) {
                let n = Number(v);
                v = this.setting[name] = isNaN(n) === true ? v : n;
            }
            return v;
        });
    }
    loadSchemas(hasSource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tablesFromProc('tv_$entitys', [hasSource === true ? 1 : 0]);
        });
    }
    saveSchema(unit, user, id, name, type, schema, run) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$entity', [unit, user, id, name, type, schema, run]);
        });
    }
    loadConstStrs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$const_strs', undefined);
        });
    }
    saveConstStr(type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$const_str', [type]);
        });
    }
    loadSchemaVersion(name, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$entity_version', [name, version]);
        });
    }
    isTuidOpen(tuid) {
        tuid = tuid.toLowerCase();
        let t = this.tuids[tuid];
        if (t === undefined)
            return false;
        if (t.isOpen === true)
            return true;
        return false;
    }
    getTuid(tuid) {
        tuid = tuid.toLowerCase();
        let ret = this.tuids[tuid];
        return ret;
    }
    getMap(map) {
        map = map.toLowerCase();
        let m = this.schemas[map];
        if (m === undefined)
            return;
        if (m.type === 'map')
            return m;
    }
    tuidGet(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.callEx('tv_' + tuid, [unit, user, id]);
        });
    }
    tuidArrGet(tuid, arr, unit, user, owner, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + arr + '$id', [unit, user, owner, id]);
        });
    }
    tuidGetAll(tuid, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '$all', [unit, user]);
        });
    }
    tuidVid(tuid, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}$vid`;
            return yield this.db.call(proc, [unit, uniqueValue]);
        });
    }
    tuidArrVid(tuid, arr, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}_${arr}$vid`;
            return yield this.db.call(proc, [unit, uniqueValue]);
        });
    }
    tuidGetArrAll(tuid, arr, unit, user, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + arr + '$all', [unit, user, owner]);
        });
    }
    tuidProxyGet(tuid, unit, user, id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '$proxy', [unit, user, id, type]);
        });
    }
    tuidIds(tuid, arr, unit, user, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = 'tv_' + tuid;
            if (arr !== '$')
                proc += '_' + arr;
            proc += '$ids';
            let ret = yield this.db.call(proc, [unit, user, ids]);
            return ret;
        });
    }
    tuidMain(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '$main', [unit, user, id]);
        });
    }
    tuidSave(tuid, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '$save', [unit, user, ...params]);
        });
    }
    tuidSetStamp(tuid, unit, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '$stamp', [unit, ...params]);
        });
    }
    tuidArrSave(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + arr + '$save', [unit, user, ...params]);
        });
    }
    tuidArrPos(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + arr + '$pos', [unit, user, ...params]);
        });
    }
    tuidSeach(tuid, unit, user, arr, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = 'tv_' + tuid + '$search';
            return yield this.db.tablesFromProc(proc, [unit, user, key || '', pageStart, pageSize]);
        });
    }
    tuidArrSeach(tuid, unit, user, arr, ownerId, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}_${arr}$search`;
            return yield this.db.tablesFromProc(proc, [unit, user, ownerId, key || '', pageStart, pageSize]);
        });
    }
    mapSave(map, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + map + '$save', [unit, user, ...params]);
        });
    }
    importVId(unit, user, source, tuid, arr, no) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_$import_vid`;
            let ret = yield this.db.tableFromProc(proc, [unit, user, source, tuid, arr, no]);
            return ret[0].vid;
        });
    }
    sheetVerify(sheet, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let sheetRun = this.sheetRuns[sheet];
            if (sheetRun === undefined)
                return;
            let { verify } = sheetRun;
            if (verify === undefined)
                return;
            let ret = yield this.db.call(`tv_${sheet}_$verify`, [unit, user, data]);
            let { length } = verify;
            if (length === 0) {
                if (ret === undefined)
                    return 'fail';
                return;
            }
            if (length === 1)
                ret = [ret];
            for (let i = 0; i < length; i++) {
                let t = ret[0];
                if (t.length > 0) {
                    return packReturn_1.packReturns(verify, ret);
                }
            }
            return;
        });
    }
    sheetSave(sheet, unit, user, app, discription, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$sheet_save', [unit, user, sheet, app, discription, data]);
        });
    }
    sheetTo(unit, user, sheetId, toArr) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$sheet_to', [unit, user, sheetId, toArr.join(',')]);
        });
    }
    sheetProcessing(sheetId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$sheet_processing', [sheetId]);
        });
    }
    sheetAct(sheet, state, action, unit, user, id, flow) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = state === '$' ?
                'tv_' + sheet + '_' + action :
                'tv_' + sheet + '_' + state + '_' + action;
            return yield this.db.callEx(sql, [unit, user, id, flow, action]);
        });
    }
    sheetStates(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state';
            return yield this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
        });
    }
    sheetStateCount(sheet, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state_count';
            return yield this.db.call(sql, [unit, user, sheet]);
        });
    }
    mySheets(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state_my';
            return yield this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
        });
    }
    getSheet(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_id';
            return yield this.db.call(sql, [unit, user, sheet, id]);
        });
    }
    sheetScan(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_scan';
            return yield this.db.call(sql, [unit, user, sheet, id]);
        });
    }
    sheetArchives(sheet, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$archives';
            return yield this.db.call(sql, [unit, user, sheet, pageStart, pageSize]);
        });
    }
    sheetArchive(unit, user, sheet, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$archive_id';
            return yield this.db.call(sql, [unit, user, sheet, id]);
        });
    }
    action(action, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.db.callEx('tv_' + action, [unit, user, data]);
            return result;
        });
    }
    query(query, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.call('tv_' + query, [unit, user, ...params]);
            return ret;
        });
    }
    // msgId: bus message id
    // body: bus message body
    bus(bus, face, unit, faceId, msgId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_' + bus + '_' + face;
            return yield this.db.call(sql, [unit, 0, faceId, msgId, body]);
        });
    }
    importData(unit, user, source, entity, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield importData_1.ImportData.exec(this, unit, this.db, source, entity, filePath);
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            try {
                yield this.initInternal();
            }
            catch (err) {
                this.schemas = {};
                console.error(err.message);
                debugger;
            }
        });
    }
    initInternal() {
        return __awaiter(this, void 0, void 0, function* () {
            let rows = yield this.loadSchemas(false);
            let schemaTable = rows[0];
            let settingTable = rows[1];
            let setting = {};
            for (let row of settingTable) {
                let v = row.value;
                let n = Number(v);
                setting[row.name] = isNaN(n) === true ? v : n;
            }
            this.uqOwner = setting['uqOwner'];
            this.uq = setting['uq'];
            this.author = setting['author'];
            this.version = setting['version'];
            this.uqId = setting['uqId'];
            console.log('init schemas: ', this.uq, this.author, this.version);
            this.schemas = {};
            this.accessSchemaArr = [];
            this.tuids = {};
            this.buses = {};
            this.entityColl = {};
            this.froms = {};
            this.sheetRuns = {};
            for (let row of schemaTable) {
                let { name, id, version, schema, run, from } = row;
                name = name.toLowerCase();
                let tuidFroms;
                let schemaObj = JSON.parse(schema);
                let runObj = JSON.parse(run);
                schemaObj.typeId = id;
                schemaObj.version = version;
                let { type, url } = schemaObj;
                if (url !== undefined)
                    url = url.toLowerCase();
                this.schemas[name] = {
                    type: type,
                    call: schemaObj,
                    run: runObj,
                };
                switch (type) {
                    case 'access':
                        this.accessSchemaArr.push(schemaObj);
                        break;
                    case 'bus':
                        this.buses[url] = schemaObj;
                        break;
                    case 'tuid':
                        this.tuids[name] = schemaObj;
                        if (from) {
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let tuidFrom = tuidFroms[name];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[name] = {};
                            tuidFrom.tuidObj = schemaObj;
                        }
                        this.buildTuidMainFields(schemaObj);
                        break;
                    case 'map':
                        if (from) {
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let { keys } = schemaObj;
                            let key0 = keys[0];
                            let tuidName = key0.tuid;
                            if (tuidName === undefined)
                                break;
                            let tuidFrom = tuidFroms[tuidName];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[tuidName] = {};
                            let mapObjs = tuidFrom.mapObjs;
                            if (mapObjs === undefined)
                                mapObjs = tuidFrom.mapObjs = {};
                            mapObjs[name] = schemaObj;
                        }
                        break;
                    case 'sheet':
                        this.sheetRuns[name] = {
                            onsave: runObj['$'] !== undefined,
                            verify: schemaObj.verify,
                        };
                        break;
                }
                this.entityColl[id] = {
                    name: name,
                    access: type !== 'sheet' ?
                        type + '|' + id :
                        {
                            $: type,
                            id: id,
                            ops: schemaObj.states && schemaObj.states.map(v => v.name)
                        }
                };
            }
            for (let i in this.froms) {
                let from = this.froms[i];
                for (let t in from) {
                    let syncTuid = from[t];
                    let { tuidObj, mapObjs } = syncTuid;
                    if (tuidObj !== undefined) {
                        syncTuid.tuid = tuidObj.name.toLowerCase();
                    }
                    if (mapObjs !== undefined) {
                        let s = [];
                        for (let m in mapObjs)
                            s.push(m.toLowerCase());
                        syncTuid.maps = s;
                    }
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i].call;
                let { type, name } = schema;
                switch (type) {
                    case 'map':
                        this.mapBorn(schema);
                        break;
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i];
                let { call } = schema;
                if (call === undefined)
                    continue;
                let circular = false;
                let tuidsArr = [call];
                let text = JSON.stringify(call, (key, value) => {
                    if (key === 'tuids') {
                        let ret = [];
                        for (let v of value) {
                            if (tuidsArr.findIndex(a => a === v) >= 0) {
                                circular = true;
                            }
                            else {
                                tuidsArr.push(v);
                                ret.push(v);
                            }
                        }
                        return ret.length > 0 ? ret : undefined;
                    }
                    else if (key !== '' && value === call) {
                        circular = true;
                        return undefined;
                    }
                    else
                        return value;
                });
                if (circular) {
                    let newCall = JSON.parse(text);
                    schema.call = newCall;
                }
            }
            //console.log('schema: %s', JSON.stringify(this.schemas));
            this.buildAccesses();
        });
    }
    buildTuidMainFields(tuidSchema) {
        let { id, base, fields, main, arrs } = tuidSchema;
        let mainFields = tuidSchema.mainFields = [
            { name: id, type: 'id' }
        ];
        if (base)
            for (let b of base)
                mainFields.push(fields.find(v => v.name === b));
        if (main)
            for (let m of main)
                mainFields.push(fields.find(v => v.name === m));
        if (arrs === undefined)
            return;
        for (let arr of arrs) {
            let { id, owner, main, fields } = arr;
            mainFields = arr.mainFields = [
                { name: id, type: 'id' },
                { name: owner, type: 'id' }
            ];
            if (main)
                for (let m of main)
                    mainFields.push(fields.find(v => v.name === m));
        }
    }
    mapBorn(schema) {
        function getCall(s) {
            let c = this.schemas[s];
            if (c === undefined)
                return;
            return c.call;
        }
        let call = getCall.bind(this);
        let { name, actions, queries } = schema;
        let sn = name.toLowerCase();
        for (let i in actions) {
            let n = sn + actions[i];
            schema.actions[i] = call(n);
        }
        for (let i in queries) {
            let n = sn + queries[i];
            schema.queries[i] = call(n);
        }
    }
    buildAccesses() {
        this.access = {
            uq: this.uqId
        };
        for (let access of this.accessSchemaArr) {
            //let la = a.toLowerCase();
            //let schema = this.schemas[la];
            //if (schema === undefined) continue;
            //let access = schema.call;
            //if (access.type !== 'access') continue;
            let acc = this.access[access.name] = {};
            for (let item of access.list) {
                let it = item;
                let pos = it.indexOf(':');
                let name, ops;
                if (pos > 0) {
                    name = it.substring(0, pos);
                    ops = it.substring(pos + 1);
                }
                else {
                    name = it;
                }
                let schema = this.schemas[name];
                if (schema === undefined)
                    continue;
                let entity = schema.call;
                if (entity === undefined)
                    continue;
                let { type, typeId } = entity;
                acc[name] = ops === undefined ?
                    type + '|' + typeId :
                    {
                        $: type,
                        id: typeId,
                        ops: ops.split('+')
                    };
            }
        }
        console.log('access: ', this.access);
    }
    getUserAccess(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.db.tablesFromProc('tv_$get_access', [unit, user]);
            let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
            return ret;
        });
    }
    getAccesses(unit, user, acc) {
        return __awaiter(this, void 0, void 0, function* () {
            let reload = yield this.getSetting(0, 'reloadSchemas');
            if (reload === 1) {
                this.schemas = undefined;
                yield this.init();
                yield this.setSetting(0, 'reloadSchemas', '0');
            }
            //await this.initSchemas();
            let access = {};
            function merge(src) {
                for (let i in src) {
                    let v = src[i];
                    if (typeof v === 'string') {
                        access[i] = v;
                        continue;
                    }
                    let dst = access[i];
                    if (dst === undefined) {
                        access[i] = v;
                        continue;
                    }
                    dst.ops = _.union(dst.ops, v.ops);
                }
            }
            if (acc === undefined) {
                for (let a in this.access) {
                    merge(this.access[a]);
                }
            }
            else {
                for (let a of acc)
                    merge(this.access[a]);
            }
            let accessEntities = yield this.getUserAccess(unit, user);
            let entityAccess = {};
            for (let entityId of accessEntities) {
                let entity = this.entityColl[entityId];
                if (entity === undefined)
                    continue;
                let { name, access } = entity;
                entityAccess[name] = access;
            }
            return {
                //access: access,
                access: entityAccess,
                tuids: this.tuids
            };
        });
    }
    getEntities(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let reload = yield this.getSetting(0, 'reloadSchemas');
            if (reload === 1) {
                this.schemas = undefined;
                yield this.init();
                yield this.setSetting(0, 'reloadSchemas', '0');
            }
            let entityAccess = {};
            for (let entityId in this.entityColl) {
                let entity = this.entityColl[entityId];
                let { name, access } = entity;
                entityAccess[name] = access;
            }
            return {
                access: entityAccess,
                tuids: this.tuids
            };
        });
    }
    getSchema(name) {
        return this.schemas[name.toLowerCase()];
    }
}
exports.Runner = Runner;
//# sourceMappingURL=runner.js.map