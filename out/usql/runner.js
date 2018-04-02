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
const db_1 = require("../db");
let runners = {};
function getRunner(name) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = runners[name];
        if (runner === null)
            return;
        if (runner !== undefined)
            return runner;
        let db = db_1.getDb(name);
        let isExists = yield db.exists();
        if (isExists === false) {
            runners[name] = null;
            return;
        }
        runner = runners[name] = new Runner(db);
        yield runner.initSchemas();
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
    db.setExists();
    return runners[name] = new Runner(db);
}
exports.createRunner = createRunner;
class Runner {
    constructor(db) {
        this.db = db;
    }
    //sysTableCount(db:Db): Promise<number> {
    //    return this.db.call('tv$sysTableCount', undefined);
    //}
    sql(sql, params) {
        return this.db.sql(sql, params);
    }
    createDatabase() {
        return this.db.createDatabase();
    }
    init(unit, user) {
        return this.db.call('tv$init', [unit, user]);
    }
    start(unit, user) {
        return this.db.call('tv$start', [unit, user]);
    }
    set(unit, name, num, str) {
        return this.db.call('tv$set', [unit, name, num, str]);
    }
    getStr(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tableFromProc('tv$get_str', [unit, name]);
            if (ret.length === 0)
                return undefined;
            return ret[0].str;
        });
    }
    getNum(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tableFromProc('tv$get_num', [unit, name]);
            if (ret.length === 0)
                return undefined;
            return ret[0].num;
        });
    }
    loadSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv$schemas', undefined);
        });
    }
    saveSchema(unit, user, id, name, type, schema, run) {
        return this.db.call('tv$schema', [unit, user, id, name, type, schema, run]);
    }
    loadConstStrs() {
        return this.db.call('tv$const_strs', undefined);
    }
    saveConstStr(type) {
        return this.db.call('tv$const_str', [type]);
    }
    loadSchemaVersion(name, version) {
        return this.db.call('tv$schema_version', [name, version]);
    }
    tuidGet(tuid, unit, user, id) {
        return this.db.call('tv' + tuid, [unit, user, id]);
    }
    tuidIds(tuid, unit, user, ids) {
        return this.db.call('tv' + tuid + '_ids', [unit, user, ids]);
    }
    tuidMain(tuid, unit, user, id) {
        return this.db.call('tv' + tuid + '_main', [unit, user, id]);
    }
    tuidSave(tuid, unit, user, params) {
        return this.db.call('tv' + tuid + '_save', [unit, user, ...params]);
    }
    tuidSeach(tuid, unit, user, key, pageStart, pageSize) {
        return this.db.tablesFromProc('tv' + tuid + '_search', [unit, user, key, pageStart, pageSize]);
    }
    sheetSave(sheet, unit, user, discription, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv$sheet_save', [unit, user, sheet, discription, data]);
        });
    }
    sheetProcessing(sheetId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv$sheet_processing', [sheetId]);
        });
    }
    sheetAct(sheet, state, action, unit, user, id, flow) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = state === '$' ?
                'tv' + sheet + '_' + action :
                'tv' + sheet + '_' + state + '_' + action;
            return yield this.db.call(sql, [unit, user, id, flow, action]);
        });
    }
    sheetStates(sheet, state, unit, user, pageStart, pageSize) {
        let sql = 'tv$sheet_state';
        return this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
    }
    sheetStateCount(sheet, unit, user) {
        let sql = 'tv$sheet_state_count';
        return this.db.call(sql, [unit, user, sheet]);
    }
    getSheet(sheet, unit, user, id) {
        let sql = 'tv$sheet_id';
        return this.db.call(sql, [unit, user, sheet, id]);
    }
    sheetArchives(sheet, unit, user, pageStart, pageSize) {
        let sql = 'tv$archives';
        return this.db.call(sql, [unit, user, sheet, pageStart, pageSize]);
    }
    sheetArchive(unit, user, sheet, id) {
        let sql = 'tv$archive_id';
        return this.db.call(sql, [unit, user, sheet, id]);
    }
    action(action, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            //let schema = await this.getSchema(action);
            let result = yield this.db.callEx('tv' + action, [unit, user, data]);
            //this.actionRun(schema, result);
            return result;
        });
    }
    query(query, unit, user, params) {
        return this.db.call('tv' + query, [unit, user, ...params]);
    }
    unitxPost(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let { service, unit, busOwner, bus, face, data } = msg;
            let schema = this.buses[busOwner + '/' + bus];
            if (schema === undefined)
                return;
            let sql = 'tv' + schema.name + '_' + face;
            return yield this.db.call(sql, [unit, 0, data]);
        });
    }
    initSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            let rows = yield this.loadSchemas();
            this.schemas = {};
            this.buses = {};
            for (let row of rows) {
                let schema = JSON.parse(row.schema);
                let run = JSON.parse(row.run);
                schema.id = row.id;
                schema.version = row.version;
                this.schemas[row.name] = {
                    call: schema,
                    run: run,
                };
                let { type, url } = schema;
                if (type === 'bus') {
                    this.buses[url] = schema;
                }
            }
            this.buildAccesses();
        });
    }
    buildAccesses() {
        this.access = {};
        //let accesses = this.app.accesses;
        for (let a in this.schemas) {
            let access = this.schemas[a].call;
            if (access.type !== 'access')
                continue;
            let acc = this.access[a] = {};
            for (let item of access.list) {
                let len = item.length;
                let i0 = item[0], i1, a2, a3;
                let entity = this.schemas[i0].call;
                let type = entity && entity.type;
                let id = entity && entity.id;
                switch (len) {
                    case 1:
                        acc[i0] = type + '|' + id;
                        break;
                    case 2:
                        a2 = acc[i0];
                        if (a2 === undefined) {
                            a2 = acc[i0] = { '$': type, id: id };
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[i0] = { '$': type, '#': true, id: id };
                        }
                        a2[item[1]] = true;
                        break;
                    case 3:
                        a2 = acc[i0];
                        if (a2 === undefined) {
                            a2 = acc[i0] = { '$': type, id: id };
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[i0] = { '$': type, '#': true, id: id };
                        }
                        i1 = item[1];
                        a3 = a2[i1];
                        if (a3 === undefined) {
                            a3 = a2[i1] = {};
                        }
                        else if (a3 === true) {
                            a3 = a2[i1] = { '#': true };
                        }
                        a3[item[2]] = true;
                        break;
                }
            }
        }
    }
    getAccesses(acc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initSchemas();
            let ret = {};
            if (acc === undefined) {
                for (let a in this.access)
                    _.merge(ret, this.access[a]);
            }
            else {
                for (let a of acc)
                    _.merge(ret, this.access[a]);
            }
            return ret;
        });
    }
    getSchema(name) {
        return this.schemas[name];
    }
}
exports.Runner = Runner;
//# sourceMappingURL=runner.js.map