"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class DbRunner {
    constructor(name, db, net = undefined) {
        this.hasSheet = false;
        this.name = name;
        this.db = db;
        this.net = net;
    }
    getDb() { return this.db.getDbName(); }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.sql(sql, params || []);
            }
            catch (err) {
                debugger;
                throw err;
            }
        });
    }
    procSql(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.db.sqlProc(procName, procSql);
            }
            catch (err) {
                debugger;
                throw err;
            }
        });
    }
    procCoreSql(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //let sqlDrop = 'DROP PROCEDURE IF EXISTS ' + procName;
                //await this.db.sql(sqlDrop, undefined);
                yield this.db.sqlDropProc(procName);
                return yield this.db.sql(procSql, undefined);
            }
            catch (err) {
                debugger;
                throw err;
            }
        });
    }
    log(unit, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.log(unit, this.net.getUqFullName(this.uq), subject, content);
        });
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
    buildDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.buildDatabase();
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.createDatabase();
        });
    }
    existsDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.exists();
        });
    }
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.buildTuidAutoId();
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tableFromProc('tv_' + proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tablesFromProc('tv_' + proc, params);
            let len = ret.length;
            if (len === 0)
                return ret;
            let pl = ret[len - 1];
            if (Array.isArray(pl) === false)
                ret.pop();
            return ret;
        });
    }
    unitCall(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCall(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCallEx(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.callEx(proc, p);
        });
    }
    unitTableFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitUserTableFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitTablesFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    unitUserTablesFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    start(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_$start', unit, user);
        });
    }
    initResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.initResDb(resDbName);
        });
    }
    init$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.init$UqDb();
        });
    }
}
exports.DbRunner = DbRunner;
//# sourceMappingURL=dbRunner.js.map