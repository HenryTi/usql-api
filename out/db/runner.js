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
const runners = {};
function getRunner(name) {
    return __awaiter(this, void 0, void 0, function* () {
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
function resetRunner(name) {
    runners[name] = undefined;
}
exports.resetRunner = resetRunner;
function createRunner(name) {
    let runner = runners[name];
    if (runner === null)
        return;
    if (runner !== undefined)
        return runner;
    let db = db_1.getDb(name);
    return runners[name] = new Runner(db);
}
exports.createRunner = createRunner;
class Runner {
    constructor(db) {
        this.db = db;
        this.setting = {};
    }
    //sysTableCount(db:Db): Promise<number> {
    //    return this.db.call('tv$sysTableCount', undefined);
    //}
    sql(sql, params) {
        return this.db.sql(sql, params);
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
    setSetting(unit, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$set_setting', [unit, name, value]);
            if (unit === 0) {
                let n = Number(value);
                this.setting[name] = n === NaN ? value : n;
            }
        });
    }
    getSetting(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield this.db.call(proc, [unit, user, ids]);
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
            let proc = 'tv_' + tuid + '_' + arr + '$search';
            return yield this.db.tablesFromProc(proc, [unit, user, ownerId, key || '', pageStart, pageSize]);
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
    getSheet(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_id';
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
    busPost(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let { service, unit, busOwner, bus, face, data } = msg;
            let schema = this.buses[busOwner + '/' + bus];
            if (schema === undefined)
                return;
            let sql = 'tv_' + schema.name + '_' + face;
            return yield this.db.call(sql, [unit, 0, data]);
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            /*
            this.app = await this.getSetting(0, 'app');
            this.author = await this.getSetting(0, 'author');
            this.version = await this.getSetting(0, 'version');
            
            await this.getSetting(0, 'reloadSchemas');
            this.usqId = await this.getSetting(0, 'usqId');
            */
            //this.isSysChat = (this.app === '$unitx' || this.app === 'unitx') 
            //    && this.author === 'henry';
            let rows = yield this.loadSchemas(false);
            let schemaTable = rows[0];
            let settingTable = rows[1];
            let setting = {};
            for (let row of settingTable) {
                let v = row.value;
                let n = Number(v);
                setting[row.name] = isNaN(n) === true ? v : n;
            }
            this.app = setting['app']; // await this.getSetting(0, 'app');
            this.author = setting['author'];
            this.version = setting['version'];
            //await this.getSetting(0, 'reloadSchemas');
            this.usqId = setting['usqId'];
            console.log('init schemas: ', this.app, this.author, this.version);
            this.schemas = {};
            this.accessSchemaArr = [];
            this.tuids = {};
            this.buses = {};
            this.entityColl = {};
            for (let row of schemaTable) {
                let { name, id, version, schema, run } = row;
                let schemaObj = JSON.parse(schema);
                let runObj = JSON.parse(run);
                schemaObj.typeId = id;
                schemaObj.version = version;
                this.schemas[name] = {
                    call: schemaObj,
                    run: runObj,
                };
                let { type, url } = schemaObj;
                switch (type) {
                    case 'access':
                        this.accessSchemaArr.push(schemaObj);
                        break;
                    case 'bus':
                        this.buses[url] = schemaObj;
                        break;
                    case 'tuid':
                        this.tuids[name] = schemaObj;
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
            usq: this.usqId
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