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
const config = require("config");
const ms_1 = require("./ms");
const my_1 = require("./my");
function createDbServer() {
    let sqlType = config.get('sqlType');
    let dbConfig = config.get('connection');
    switch (sqlType) {
        case 'mysql': return new my_1.MyDbServer(dbConfig);
        case 'mssql': return new ms_1.MsDbServer(dbConfig);
    }
}
let dbServer = createDbServer();
class Db {
    constructor(dbName) {
        this.dbName = dbName;
        this.isExists = false;
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExists === true)
                return true;
            return this.isExists = yield dbServer.existsDatabase(this.dbName);
        });
    }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.sql(this.dbName, sql, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.call(this.dbName, proc, params);
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.callEx(this.dbName, proc, params);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.tableFromProc(this.dbName, proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.tablesFromProc(this.dbName, proc, params);
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield dbServer.createDatabase(this.dbName);
        });
    }
}
exports.Db = Db;
const dbs = {};
/*
const projects = config.get<any>("projects");

export function dbNameFromProject(projectName:string) {
    let proj = projects[projectName];
    return proj && proj.db;
}
*/
const dbCollection = (function () {
    const dbColl = "db";
    if (!config.has(dbColl))
        return {};
    return config.get("db");
})();
function getDb(name) {
    let db = dbs[name];
    if (db !== undefined)
        return db;
    let dbName = dbCollection[name];
    if (dbName === undefined)
        dbName = name;
    //let dbName = dbNameFromProject(name);
    //if (dbName === undefined) return;
    // 开发用户定义usqldb之后，直接用usqldb的dbname，所以，dbname不能有符号什么的，因为会通过url上传
    //if (dbName === undefined) 
    //let dbName = name;
    if (dbServer === undefined)
        dbServer = createDbServer();
    dbs[name] = db = new Db(dbName);
    return db;
}
exports.getDb = getDb;
//# sourceMappingURL=db.js.map