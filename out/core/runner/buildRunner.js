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
exports.BuildRunner = void 0;
const centerApi_1 = require("../centerApi");
class BuildRunner {
    constructor(db) {
        this.setting = {};
        this.db = db;
    }
    getDb() { return this.db.getDbName(); }
    initSetting() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$init_setting', []);
        });
    }
    setSetting(unit, name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            yield this.unitCall('tv_$set_setting', unit, name, value);
            if (unit === 0) {
                let n = Number(value);
                this.setting[name] = n === NaN ? value : n;
            }
        });
    }
    getSetting(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            let ret = yield this.unitTableFromProc('tv_$get_setting', unit, name);
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
    setSettingInt(unit, name, int, big) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unitCall('tv_$set_setting_int', unit, name, int, big);
        });
    }
    getSettingInt(unit, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.unitTableFromProc('tv_$get_setting_int', unit, name);
            return ret[0];
        });
    }
    setUnitAdmin(unitAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (let ua of unitAdmin) {
                    let { unit, admin } = ua;
                    yield this.db.call('tv_$set_unit_admin', [unit, admin]);
                }
            }
            catch (err) {
                console.error('set unit admin', err);
            }
        });
    }
    // type: 1=prod, 2=test
    refreshXuid(service) {
        return __awaiter(this, void 0, void 0, function* () {
            let tbl = yield this.db.tableFromProc('tv_$xuid_section_get', []);
            let { section, sectionCount } = tbl[0];
            if (sectionCount <= 0 || sectionCount > 8) {
                return;
            }
            let type = this.db.isTesting === true ? 2 : 1;
            let ret = yield centerApi_1.centerApi.xuidApply(service, type, section, sectionCount);
            if (ret) {
                let { start, end, section_max, service_max } = ret;
                if (start) {
                    yield this.db.call('tv_$xuid_section_set', [start, end - start]);
                }
                else {
                    let err = `xuid unmatch: here_max:${section_max} center_max here: ${service_max}`;
                    console.error(err);
                    throw err;
                }
            }
        });
    }
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
    procCoreSql(procName, procSql, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.sqlProc(procName, procSql);
                yield this.db.buildProc(procName, procSql, isFunc);
            }
            catch (err) {
                debugger;
                throw err;
            }
        });
    }
    buildProc(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.buildRealProcFrom$ProcTable(proc);
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
            let ret = yield this.db.buildDatabase();
            yield this.db.createProcObjs();
            return ret;
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.createDatabase();
            yield this.db.createProcObjs();
            return ret;
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
    createResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.createResDb(resDbName);
        });
    }
    create$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.create$UqDb();
        });
    }
}
exports.BuildRunner = BuildRunner;
//# sourceMappingURL=buildRunner.js.map