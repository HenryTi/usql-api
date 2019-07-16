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
const dbServer_1 = require("./dbServer");
class MsDbServer extends dbServer_1.DbServer {
    constructor(dbConfig) {
        super();
    }
    sql(db, sql, params) { return; }
    call(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () { return; });
    }
    callEx(db, proc, params) { return; }
    tableFromProc(db, proc, params) { return; }
    tablesFromProc(db, proc, params) { return; }
    createDatabase(db) { return; }
    existsDatabase(db) { return; }
    uqDbs() { return; }
    initResDb(resDbName) { return; }
}
exports.MsDbServer = MsDbServer;
//# sourceMappingURL=ms.js.map