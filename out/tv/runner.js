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
        if (runner === undefined) {
            let db = db_1.getDb(name);
            let isExists = yield db.exists();
            if (isExists === false) {
                runners[name] = null;
                return;
            }
            runner = new Runner(db);
        }
        yield runner.initSchemas();
        return runners[name] = runner;
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
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$init', [unit, user]);
        });
    }
    start(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$start', [unit, user]);
        });
    }
    set(unit, name, num, str) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$set', [unit, name, num, str]);
        });
    }
    getStr(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tableFromProc('tv_$get_str', [unit, name]);
            if (ret.length === 0)
                return undefined;
            return ret[0].str;
        });
    }
    getNum(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tableFromProc('tv_$get_num', [unit, name]);
            if (ret.length === 0)
                return undefined;
            return ret[0].num;
        });
    }
    loadSchemas(hasSource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$schemas', [hasSource === true ? 1 : 0]);
        });
    }
    saveSchema(unit, user, id, name, type, schema, run) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$schema', [unit, user, id, name, type, schema, run]);
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
            return yield this.db.call('tv_$schema_version', [name, version]);
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
            let proc = 'tv_' + tuid;
            if (arr === undefined) {
                proc += '$search';
                return yield this.db.tablesFromProc(proc, [unit, user, key || '', pageStart, pageSize]);
            }
            else {
                proc += '_' + arr;
                proc += '$all';
                return yield this.db.tablesFromProc(proc, [unit, user, key]);
            }
        });
    }
    sheetSave(sheet, unit, user, app, api, discription, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$sheet_save', [unit, user, sheet, app, api, discription, data]);
        });
    }
    tuidBindSlaveSave(tuid, slave, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + slave + '$save', [unit, user, ...params]);
        });
    }
    tuidBindSlaves(tuid, unit, user, slave, masterId, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + tuid + '_' + slave + '$ids', [unit, user, masterId, pageStart, pageSize]);
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
            return yield this.db.call('tv_' + query, [unit, user, ...params]);
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
    initSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            this.app = yield this.getStr(0, 'app');
            this.author = yield this.getStr(0, 'author');
            this.version = yield this.getStr(0, 'version');
            //this.isSysChat = (this.app === '$unitx' || this.app === 'unitx') 
            //    && this.author === 'henry';
            let rows = yield this.loadSchemas(false);
            //console.log('schema raw rows: %s', JSON.stringify(rows));
            console.log('init schemas: ', this.app, this.author, this.version);
            this.schemas = {};
            this.tuids = {};
            this.buses = {};
            for (let row of rows) {
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
                    case 'bus':
                        this.buses[url] = schemaObj;
                        break;
                    case 'tuid':
                        this.tuids[name] = schemaObj;
                        break;
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
            /*
            for (let i in this.schemas) {
                let schema = this.schemas[i];
                let {call} = schema;
                let {name, type} = call;
                let tuids:any[] = [];
                switch (type) {
                    default: continue;
                    case 'tuid':
                        //this.tuidSlaves(call);
                        this.tuidRefTuids(call, tuids);
                        break;
                    case 'action': this.actionRefTuids(call, tuids); break;
                    case 'sheet': this.sheetRefTuids(call, tuids); break;
                    case 'query': this.queryRefTuids(call, tuids); break;
                    case 'book': this.bookRefTuids(call, tuids); break;
                    case 'map': this.mapRefTuids(call, tuids); break;
                }
                if (tuids.length === 0) continue;
                call.tuids = tuids;
            }
            */
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
                        // slave in tuid
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
    tuidSlaves(schema) {
        let { slaves } = schema;
        if (slaves === undefined)
            return;
        let ret = {};
        function getCall(s) {
            let c = this.schemas[s];
            if (c === undefined)
                return;
            return c.call;
        }
        ;
        let call = getCall.bind(this);
        for (let sn of slaves) {
            let slaveBook = call(sn);
            let { master, slave } = slaveBook;
            ret[sn] = {
                master: call(master),
                slave: call(slave),
                book: slaveBook,
                page: call(sn + '$page$'),
                pageSlave: call(sn + '$page$slave$'),
                all: call(sn + '$all$'),
                add: call(sn + '$add$'),
                del: call(sn + '$del$'),
            };
        }
        schema.slaves = ret;
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
    fieldsTuids(fields, tuids) {
        if (fields === undefined)
            return;
        for (let f of fields) {
            let { tuid } = f;
            if (tuid === undefined)
                continue;
            let schema = this.schemas[tuid.toLowerCase()];
            if (schema === undefined) {
                continue;
            }
            this.tuidsPush(tuids, schema.call);
        }
    }
    arrsTuids(arrs, tuids) {
        if (arrs === undefined)
            return;
        for (let arr of arrs) {
            this.fieldsTuids(arr.fields, tuids);
        }
    }
    returnsTuids(returns, tuids) {
        if (returns === undefined)
            return;
        for (let ret of returns) {
            this.fieldsTuids(ret.fields, tuids);
        }
    }
    tuidsPush(tuids, tuid) {
        if (tuids.find(v => v === tuid) === undefined)
            tuids.push(tuid);
    }
    // 建立tuid, action, sheet, query, book里面引用到的tuids
    tuidRefTuids(schema, tuids) {
        this.fieldsTuids(schema.fields, tuids);
        /*
        let {slaves} = schema;
        if (slaves !== undefined) {
            for (let i in slaves) {
                let slaveBook = slaves[i];
                this.slaveRefTuids(slaveBook, tuids);
            }
        }*/
    }
    actionRefTuids(schema, tuids) {
        this.fieldsTuids(schema.fields, tuids);
        this.arrsTuids(schema.arrs, tuids);
        this.returnsTuids(schema.returns, tuids);
    }
    sheetRefTuids(schema, tuids) {
        this.fieldsTuids(schema.fields, tuids);
        this.arrsTuids(schema.arrs, tuids);
        let { states } = schema;
        if (states !== undefined) {
            for (let state of states) {
                let { actions } = state;
                if (actions === undefined)
                    continue;
                for (let action of actions) {
                    this.returnsTuids(action.returns, tuids);
                }
            }
        }
    }
    queryRefTuids(schema, tuids) {
        this.fieldsTuids(schema.fields, tuids);
        this.returnsTuids(schema.returns, tuids);
    }
    bookRefTuids(schema, tuids) {
        this.fieldsTuids(schema.fields, tuids);
        this.returnsTuids(schema.returns, tuids);
    }
    mapRefTuids(schema, tuids) {
        let { fields, returns, master, slave, book, page, pageSlave, all, add, del } = schema;
        this.fieldsTuids(fields, tuids);
        this.returnsTuids(returns, tuids);
        /*
        this.tuidsPush(tuids, master);
        this.tuidsPush(tuids, slave);
        //book: slaveBook,
        this.queryRefTuids(page, tuids);
        this.queryRefTuids(pageSlave, tuids);
        this.queryRefTuids(all, tuids);
        this.actionRefTuids(add, tuids);
        this.actionRefTuids(del, tuids);
    */
    }
    buildAccesses() {
        this.access = {};
        //let accesses = this.app.accesses;
        for (let a in this.schemas) {
            let la = a.toLowerCase();
            let schema = this.schemas[la];
            if (schema === undefined)
                continue;
            let access = schema.call;
            if (access.type !== 'access')
                continue;
            let acc = this.access[la] = {};
            for (let item of access.list) {
                let len = item.length;
                let i0 = item[0], i1, li1, a2, a3;
                let li0 = i0.toLowerCase();
                schema = this.schemas[li0];
                if (schema === undefined)
                    continue;
                let entity = schema.call;
                let type = entity && entity.type;
                let id = entity && entity.id;
                switch (len) {
                    case 1:
                        acc[li0] = type + '|' + id; // + this.tuidProxies(entity);
                        //if (type === 'tuid') this.addSlavesAccess(acc, entity);
                        break;
                    case 2:
                        a2 = acc[li0];
                        if (a2 === undefined) {
                            a2 = acc[li0] = { '$': type, id: id };
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[li0] = { '$': type, '#': true, id: id };
                        }
                        i1 = item[1];
                        li1 = i1.toLowerCase();
                        a2[li1] = true;
                        break;
                    case 3:
                        a2 = acc[li0];
                        if (a2 === undefined) {
                            a2 = acc[li0] = { '$': type, id: id };
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[li0] = { '$': type, '#': true, id: id };
                        }
                        i1 = item[1];
                        li1 = i1.toLowerCase();
                        a3 = a2[li1];
                        if (a3 === undefined) {
                            a3 = a2[li1] = {};
                        }
                        else if (a3 === true) {
                            a3 = a2[li1] = { '#': true };
                        }
                        a3[item[2].toLowerCase] = true;
                        break;
                }
            }
        }
        //console.log('access: %s', JSON.stringify(this.access));
    }
    /*
        private addSlavesAccess(acc:any, entity:any) {
            let {slaves} = entity;
            if (slaves === undefined) return;
            for (let i in slaves) {
                let {tuid, book, page, pageSlave, all, add, del} = slaves[i];
                this.addEntityAccess(acc, tuid);
                this.addEntityAccess(acc, book);
                this.addEntityAccess(acc, page);
                this.addEntityAccess(acc, pageSlave);
                this.addEntityAccess(acc, all);
                this.addEntityAccess(acc, add);
                this.addEntityAccess(acc, del);
            }
        }
    */
    addEntityAccess(acc, entity) {
        if (!entity)
            return;
        let { name, type, id } = entity;
        acc[name.toLowerCase()] = type + '|' + id; // + this.tuidProxies(entity);
    }
    /*
    private tuidProxies(tuid:any) {
        let ret = '';
        if (tuid === undefined) return ret;
        if (tuid.type !== 'tuid') return ret;
        let proxies = tuid.proxies;
        if (proxies === undefined) return ret;
        for (let i in proxies) {
            ret += '|' + i;
        }
        return ret;
    }
    */
    getAccesses(acc) {
        return __awaiter(this, void 0, void 0, function* () {
            let reload = yield this.getNum(0, 'reloadSchemas');
            if (reload === 1) {
                this.schemas = undefined;
                yield this.set(0, 'reloadSchemas', 0, null);
            }
            //await this.initSchemas();
            let access = {};
            if (acc === undefined) {
                for (let a in this.access) {
                    _.merge(access, this.access[a]);
                }
            }
            else {
                for (let a of acc)
                    _.merge(access, this.access[a]);
            }
            return {
                access: access,
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