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
exports.dbLogger = exports.create$UqDb = exports.SpanLog = exports.UnitxTestDb = exports.UnitxProdDb = exports.UnitxDb = exports.UqDb = exports.Db = exports.env = void 0;
const config = require("config");
const _ = require("lodash");
const tool_1 = require("../tool");
const ms_1 = require("./ms");
const my_1 = require("./my");
const runner_1 = require("./runner");
class Env {
    constructor() {
        this.isDevelopment = false;
        this.isDevdo = false;
        let nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            return;
        switch (nodeEnv.toLowerCase()) {
            case Env.const_development:
                this.isDevelopment = true;
                this.configDebugging = config.get('debugging');
                this.localhost = 'localhost:' + config.get('port');
                this.configServers = config.get('servers');
                break;
            case Env.const_devdo:
                this.isDevdo = true;
                break;
        }
    }
    getConnection() {
        var _a, _b;
        if (this.conn)
            return this.conn;
        let conn;
        if (this.isDevelopment === true) {
            let uqApi = (_a = this.configDebugging) === null || _a === void 0 ? void 0 : _a['uq-api'];
            if (uqApi) {
                conn = (_b = this.configServers) === null || _b === void 0 ? void 0 : _b[uqApi];
            }
        }
        if (!conn) {
            if (config.has(Env.const_connection) === true) {
                conn = config.get(Env.const_connection);
            }
        }
        if (!conn) {
            throw `connection need to be defined in config.json`;
        }
        return this.conn = _.clone(conn);
    }
}
Env.const_connection = 'connection';
Env.const_development = 'development';
Env.const_devdo = 'devdo';
exports.env = new Env();
class Db {
    constructor(dbName) {
        this.isExists = false;
        this.dbName = dbName;
        this.dbServer = this.createDbServer();
    }
    /*
    // 数据库名称对照表
    private static dbCollection:{[name:string]:string} = {}
    
    private static getDbName(name:string): string {
        return Db.dbCollection[name] || name;
    }
    */
    static db(name) {
        let db = Db.dbs[name]; //.getCacheDb(name);
        if (db !== undefined)
            return db;
        let dbName = name; // Db.getDbName(name);
        db = new UqDb(dbName);
        return Db.dbs[name] = db;
    }
    getDbName() { return this.dbName; }
    createDbServer() {
        let sqlType = config.get('sqlType');
        let dbConfig = this.getDbConfig();
        if (dbConfig === undefined)
            throw 'dbConfig not defined';
        this.serverId = dbConfig['server-id'];
        switch (sqlType) {
            case 'mysql': return new my_1.MyDbServer(this.dbName, dbConfig);
            case 'mssql': return new ms_1.MsDbServer(this.dbName, dbConfig);
        }
    }
    reset() {
        this.dbServer.reset();
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExists === true)
                return true;
            return this.isExists = yield this.dbServer.existsDatabase(this.dbName);
        });
    }
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
    logPerformance(tick, log, ms) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.dbServer.call('$uq', 'performance', [tick, log, ms]);
            }
            catch (err) {
                tool_1.logger.error(err);
                let { message, sqlMessage } = err;
                let msg = '';
                if (message)
                    msg += message;
                if (sqlMessage)
                    msg += ' ' + sqlMessage;
                yield this.dbServer.call('$uq', 'performance', [Date.now(), msg, 0]);
            }
        });
    }
    createProcObjs() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.createProcObjs(this.dbName);
        });
    }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.devLog('sql', params);
            return yield this.dbServer.sql(sql, params);
        });
    }
    sqlDropProc(procName, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.sqlDropProc(this.dbName, procName, isFunc);
        });
    }
    sqlProc(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.sqlProc(this.dbName, procName, procSql);
        });
    }
    buildProc(procName, procSql, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.buildProc(this.dbName, procName, procSql, isFunc);
        });
    }
    buildRealProcFrom$ProcTable(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.buildRealProcFrom$ProcTable(this.dbName, proc);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.call(this.dbName, proc, params);
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.callEx(this.dbName, proc, params);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.tableFromProc(this.dbName, proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
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
    createResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.createResDb(resDbName);
        });
    }
    create$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.create$UqDb();
        });
    }
}
exports.Db = Db;
Db.dbs = {};
class UqDb extends Db {
    getDbConfig() {
        let ret = exports.env.getConnection();
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}
exports.UqDb = UqDb;
class UnitxDb extends Db {
    getDbConfig() {
        let ret = this.getUnitxConnection();
        return ret;
    }
    getUnitxConnection() {
        var _a, _b;
        if (this.unitxConn)
            return this.unitxConn;
        let conn;
        if (exports.env.isDevelopment === true) {
            let unitx = (_a = exports.env.configDebugging) === null || _a === void 0 ? void 0 : _a['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = (_b = exports.env.configServers) === null || _b === void 0 ? void 0 : _b[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = exports.env.getConnection();
        }
        return this.unitxConn = _.clone(conn);
    }
}
exports.UnitxDb = UnitxDb;
class UnitxProdDb extends UnitxDb {
    getDebugConfigName(unitx) { return unitx.prod; }
}
exports.UnitxProdDb = UnitxProdDb;
class UnitxTestDb extends UnitxDb {
    getDebugConfigName(unitx) { return unitx.test; }
}
exports.UnitxTestDb = UnitxTestDb;
class SpanLog {
    constructor(logger, log) {
        this.logger = logger;
        if (log) {
            if (log.length > 2048)
                log = log.substr(0, 2048);
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
const $uq = '$uq';
function create$UqDb() {
    return __awaiter(this, void 0, void 0, function* () {
        let db = Db.db($uq);
        let runner = new runner_1.EntityRunner($uq, db);
        yield runner.create$UqDb();
    });
}
exports.create$UqDb = create$UqDb;
const tSep = '\r';
const nSep = '\r\r';
class DbLogger {
    constructor(minSpan = 0) {
        this.tick = Date.now();
        this.spans = [];
        this.minSpan = minSpan;
    }
    open(log) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db === undefined) {
                this.db = Db.db(undefined);
            }
            return new SpanLog(this, log);
        });
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
        for (let span of spans) {
            let now = Date.now();
            let { log, tick, ms } = span;
            if (ms === undefined || ms < 0 || ms > 1000000) {
                debugger;
            }
            if (tick > now || tick < now - 1000000) {
                //debugger;
            }
            this.db.logPerformance(tick, log, ms);
        }
    }
}
exports.dbLogger = new DbLogger();
//# sourceMappingURL=db.js.map