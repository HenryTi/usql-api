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
exports.DbServer = void 0;
class DbServer {
    constructor(dbName) {
        this.dbName = dbName;
        this.builder = this.createBuilder();
    }
    execSql(unit, user, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    execSqlTrans(unit, user, sql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
            return ret;
        });
    }
    IDActs(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDActs(param);
            return yield this.execSqlTrans(unit, user, sql);
        });
    }
    IDDetail(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDDetail(param);
            return yield this.execSqlTrans(unit, user, sql);
        });
    }
    IDDetailGet(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDDetailGet(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    ID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ID(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyID(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IX(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IXr(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IXr(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIX(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IDLog(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDLog(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IDSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDSum(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIDSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIDSum(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IXSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IXSum(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    KeyIXSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyIXSum(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IDinIX(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDinIX(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IDxID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDxID(param);
            return yield this.execSql(unit, user, sql);
        });
    }
    IDTree(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDTree(param);
            return yield this.execSql(unit, user, sql);
        });
    }
}
exports.DbServer = DbServer;
//# sourceMappingURL=dbServer.js.map