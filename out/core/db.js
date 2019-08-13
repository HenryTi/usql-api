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
const const_connectionUnitx = 'connection_$unitx';
const const_connection = 'connection';
const const_development = 'development';
const const_unitx = '$unitx';
exports.isDevelopment = (function () {
    return (process.env.NODE_ENV === const_development);
})();
class Db {
    constructor(dbName) {
        this.dbName = dbName;
        this.dbServer = this.createDbServer();
        this.isExists = false;
    }
    getDbName() { return this.dbName; }
    getDbConfig() {
        return config.get(const_connection);
    }
    createDbServer() {
        let sqlType = config.get('sqlType');
        let dbConfig = this.getDbConfig();
        if (dbConfig === undefined)
            throw 'dbConfig not defined';
        switch (sqlType) {
            case 'mysql': return new my_1.MyDbServer(dbConfig);
            case 'mssql': return new ms_1.MsDbServer(dbConfig);
        }
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExists === true)
                return true;
            return this.isExists = yield this.dbServer.existsDatabase(this.dbName);
        });
    }
    /*
    async setDebugJobs():Promise<void> {
        await this.dbServer.setDebugJobs();
    }
    async uqs(): Promise<any[]> {
        return await this.dbServer.uqDbs();
    }
    */
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.isDevelopment === true)
                console.log(this.dbName, ' sql: ', params.join(','));
            return yield this.dbServer.sql(this.dbName, sql, params);
        });
    }
    log(unit, uq, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.call('$uq', 'log', [unit, uq, subject, content]);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.isDevelopment === true)
                console.log(this.dbName, '.', proc, ': ', params.join(','));
            return yield this.dbServer.call(this.dbName, proc, params);
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.isDevelopment === true)
                console.log(this.dbName, '.', proc, ': ', params.join(','));
            return yield this.dbServer.callEx(this.dbName, proc, params);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.isDevelopment === true)
                console.log(this.dbName, '.', proc, ': ', params.join(','));
            return yield this.dbServer.tableFromProc(this.dbName, proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (exports.isDevelopment === true)
                console.log(this.dbName, '.', proc, ': ', params.join(','));
            return yield this.dbServer.tablesFromProc(this.dbName, proc, params);
        });
    }
    createDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.createDatabase(this.dbName);
        });
    }
    buildDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.buildDatabase(this.dbName);
        });
    }
    setDebugJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.setDebugJobs();
        });
    }
    uqDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.uqDbs();
        });
    }
    initResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.initResDb(resDbName);
        });
    }
    init$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.init$UqDb();
        });
    }
}
exports.Db = Db;
class UnitxDb extends Db {
    getDbConfig() {
        if (config.has(const_connectionUnitx) === true) {
            return config.get(const_connectionUnitx);
        }
        else {
            throw `server '${config.get('servername')}' has no connection_$unitx defined in config.json`;
        }
    }
}
const dbs = {};
/*
const projects = config.get<any>("projects");

export function dbNameFromProject(projectName:string) {
    let proj = projects[projectName];
    return proj && proj.db;
}
*/
// 数据库名称对照表
const dbCollection = (function () {
    const dbColl = "db";
    if (!config.has(dbColl))
        return {};
    return config.get(dbColl);
})();
function getDb(name) {
    let db = getCacheDb(name);
    if (db !== undefined)
        return db;
    let dbName = getDbName(name);
    return dbs[name] = new Db(dbName);
}
exports.getDb = getDb;
function getUnitxDb(testing) {
    let name = const_unitx;
    if (testing === true)
        name += '$test';
    let db = getCacheDb(name);
    if (db !== undefined)
        return db;
    let dbName = getDbName(name);
    return dbs[name] = new UnitxDb(dbName);
}
exports.getUnitxDb = getUnitxDb;
function getDbName(name) {
    return dbCollection[name] || name;
}
function getCacheDb(name) {
    return dbs[name];
}
//# sourceMappingURL=db.js.map