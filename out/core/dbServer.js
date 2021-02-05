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
    IDActs(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDActs(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
            return ret;
        });
    }
    IDDetail(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDDetail(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
            return ret;
        });
    }
    IDDetailGet(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDDetailGet(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    ID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ID(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    KeyID(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyID(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    ID2(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.ID2(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    KeyID2(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.KeyID2(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    IDLog(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDLog(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
    IDSum(unit, user, param) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.builder.IDSum(param);
            let ret = yield this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
            return ret;
        });
    }
}
exports.DbServer = DbServer;
//# sourceMappingURL=dbServer.js.map