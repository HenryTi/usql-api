"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsDbServer = void 0;
const dbServer_1 = require("./dbServer");
class MsDbServer extends dbServer_1.DbServer {
    constructor(dbName, dbConfig) {
        super();
    }
    createProcObjs(db) { return; }
    reset() { }
    ;
    sql(db, sql, params) { return; }
    sqlProc(db, procName, procSql) { return; }
    buildProc(db, procName, procSql) { return; }
    sqlDropProc(db, procName) { return; }
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