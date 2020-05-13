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
const runner_1 = require("./runner");
const const_connectionUnitx = 'connection_$unitx';
const const_connection = 'connection';
const const_development = 'development';
const const_devdo = 'devdo';
const const_unitx = '$unitx';
function isNodeEnvEqu(...envs) {
    let nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv)
        return false;
    let e = nodeEnv.toLowerCase();
    return envs.findIndex(v => v === e) >= 0;
}
exports.isDevelopment = isNodeEnvEqu(const_development);
exports.isDevdo = isNodeEnvEqu(const_devdo);
exports.isDev = isNodeEnvEqu(const_development, const_devdo);
class Db {
    constructor(dbName) {
        this.dbName = dbName;
        this.dbServer = this.createDbServer();
        this.isExists = false;
    }
    /*(function () {
        const dbColl = "db";
        if (!config.has(dbColl)) return {};
        return config.get<any>(dbColl);
    })();*/
    /*
    private static getDb(name:string):Db {
        let db = Db.dbs[name]; //.getCacheDb(name);
        if (db !== undefined) return db;
        let dbName = Db.getDbName(name);
        db = new Db(dbName);
        return Db.dbs[name] = db;
    }*/
    /*
    private static getUnitxDb(testing:boolean):Db {
        let name = const_unitx;
        if (testing === true) name += '$test';
        let db = Db.dbs[name]; //.getCacheDb(name);
        if (db !== undefined) return db;
        let dbName = Db.getDbName(name);
        return Db.dbs[name] = new UnitxDb(dbName);
    }*/
    static getDbName(name) {
        return Db.dbCollection[name] || name;
    }
    /*
    private static getCacheDb(name:string):Db {
        return Db.dbs[name];
    }*/
    static db(name) {
        name = name || $uq;
        let db = Db.dbs[name]; //.getCacheDb(name);
        if (db !== undefined)
            return db;
        let dbName = Db.getDbName(name);
        db = new Db(dbName);
        return Db.dbs[name] = db;
    }
    static unitxDb(testing) {
        let name = const_unitx;
        if (testing === true)
            name += '$test';
        let db = Db.dbs[name]; // getCacheDb(name);
        if (db !== undefined)
            return db;
        let dbName = Db.getDbName(name);
        return Db.dbs[name] = new UnitxDb(dbName);
    }
    reset() {
        this.dbServer.reset();
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
            case 'mysql': return new my_1.MyDbServer(this.dbName, dbConfig);
            case 'mssql': return new ms_1.MsDbServer(this.dbName, dbConfig);
        }
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
                console.error(err);
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
            return yield this.dbServer.sql(this.dbName, sql, params);
        });
    }
    sqlDropProc(procName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.sqlDropProc(this.dbName, procName);
        });
    }
    sqlProc(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.dbServer.sqlProc(this.dbName, procName, procSql);
        });
    }
    buildProc(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dbServer.buildProc(this.dbName, procName, procSql);
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
// 数据库名称对照表
Db.dbCollection = {};
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