"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsDbServer = void 0;
const builder_1 = require("./builder");
const dbServer_1 = require("./dbServer");
class MsDbServer extends dbServer_1.DbServer {
    constructor(dbName, dbConfig) {
        super();
    }
    createBuilder() { return new builder_1.MsBuilder(); }
    createProcObjs(db) { return; }
    reset() { }
    ;
    sql(sql, params) { return; }
    sqlProc(db, procName, procSql) { return; }
    buildProc(db, procName, procSql, isFunc) { return; }
    buildRealProcFrom$ProcTable(db, proc) { return; }
    sqlDropProc(db, procName, isFunc) { return; }
    call(db, proc, params) { return; }
    callEx(db, proc, params) { return; }
    buildTuidAutoId(db) { return; }
    tableFromProc(db, proc, params) { return; }
    tablesFromProc(db, proc, params) { return; }
    buildDatabase(db) { return; }
    createDatabase(db) { return; }
    existsDatabase(db) { return; }
    setDebugJobs() { return; }
    uqDbs() { return; }
    createResDb(resDbName) { return; }
    create$UqDb() { return; }
}
exports.MsDbServer = MsDbServer;
//# sourceMappingURL=ms.js.map