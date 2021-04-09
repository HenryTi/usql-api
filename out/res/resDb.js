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
exports.getResDbRunner = exports.createResDb = void 0;
const core_1 = require("../core");
const resDbName = '$res';
function createResDb() {
    return __awaiter(this, void 0, void 0, function* () {
        let db = core_1.Db.db(resDbName);
        let runner = new core_1.EntityRunner(resDbName, db);
        yield runner.createResDb(resDbName);
    });
}
exports.createResDb = createResDb;
let resDbRunner;
function getResDbRunner() {
    return __awaiter(this, void 0, void 0, function* () {
        if (resDbRunner === undefined) {
            let db = core_1.Db.db(resDbName);
            resDbRunner = new core_1.EntityRunner(resDbName, db);
        }
        return resDbRunner;
    });
}
exports.getResDbRunner = getResDbRunner;
//# sourceMappingURL=resDb.js.map