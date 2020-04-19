"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbServer_1 = require("./dbServer");
class MsDbServer extends dbServer_1.DbServer {
    constructor(dbConfig) {
        super();
    }
    initProcObjs(db) { return; }
    sql(db, sql, params) { return; }
    sqlProc(db, procName, procSql) { return; }
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
    initResDb(resDbName) { return; }
    init$UqDb() { return; }
}
exports.MsDbServer = MsDbServer;
//# sourceMappingURL=ms.js.map