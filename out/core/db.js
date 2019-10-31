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
const config = require("config");
const _ = require("lodash");
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
        let ret = _.clone(config.get(const_connection));
        ret.flags = '-FOUND_ROWS';
        return ret;
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
    private devLog(proc:string, params:any[]) {
        if (isDevelopment===true) console.log(this.dbName, '.', proc, ': ', params && params.join(','))
    }
    */
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.buildTuidAutoId(this.dbName);
        });
    }
    log(unit, uq, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.call('$uq', 'log', [unit, uq, subject, content]);
        });
    }
    logPerformance(log) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.dbServer.call('$uq', 'performance', [log]);
            }
            catch (err) {
                console.error(err);
                let { message, sqlMessage } = err;
                let msg = '';
                if (message)
                    msg += message;
                if (sqlMessage)
                    msg += ' ' + sqlMessage;
                yield this.dbServer.call('$uq', 'performance', [msg]);
            }
        });
    }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog('sql', params);
            return yield this.dbServer.sql(this.dbName, sql, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog(proc, params);
            return yield this.dbServer.call(this.dbName, proc, params);
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog(proc, params);
            return yield this.dbServer.callEx(this.dbName, proc, params);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog(proc, params);
            return yield this.dbServer.tableFromProc(this.dbName, proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog(proc, params);
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
class SpanLog {
    constructor(logger, log) {
        this.logger = logger;
        if (log) {
            if (log.length > 2048)
                log = log.substr(0, 2048);
            if (log.indexOf('\r') >= 0) {
                let reg = new RegExp('\r', "g");
                log = log.replace(reg, '');
                if (log.indexOf('\r') >= 0)
                    debugger;
            }
        }
        this._log = log;
        this.tick = Date.now();
        this.tries = 0;
    }
    close() {
        this._ms = Date.now() - this.tick;
        this.logger.add(this);
    }
    get ms() { return this._ms; }
    get log() {
        if (this.error !== undefined) {
            return `${this._log} RETRY:${this.tries} ERR:${this.error}`;
        }
        if (this.tries > 0) {
            return `${this._log} RETRY:${this.tries}`;
        }
        return this._log;
    }
}
exports.SpanLog = SpanLog;
const tSep = '\r';
const nSep = '\r\r';
class DbLogger {
    constructor(minSpan = 0) {
        this.tick = Date.now();
        this.spans = [];
        this.db = new Db(undefined);
        this.minSpan = minSpan;
    }
    open(log) {
        return new SpanLog(this, log);
    }
    add(span) {
        let { ms: count, log } = span;
        if (count >= this.minSpan) {
            this.spans.push(span);
        }
        let len = this.spans.length;
        if (len === 0)
            return;
        let tick = Date.now();
        if (len > 10 || tick - this.tick > 10 * 1000) {
            this.tick = tick;
            let spans = this.spans;
            this.spans = [];
            this.save(spans);
        }
    }
    save(spans) {
        let now = Date.now();
        let log = spans.map(v => {
            let { log, tick, ms } = v;
            if (ms === undefined || ms < 0 || ms > 1000000) {
                debugger;
            }
            if (tick > now || tick < now - 1000000) {
                debugger;
            }
            if (log.indexOf('\r') >= 0) {
                debugger;
            }
            return `${tick}${tSep}${log}${tSep}${ms}`;
        }).join(nSep);
        this.db.logPerformance(log);
    }
}
exports.dbLogger = new DbLogger();
//# sourceMappingURL=db.js.map