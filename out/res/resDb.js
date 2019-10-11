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
const core_1 = require("../core");
const resDbName = '$res';
function initResDb() {
    return __awaiter(this, void 0, void 0, function* () {
        let db = new core_1.Db(resDbName);
        let runner = new core_1.Runner(resDbName, db);
        yield runner.initResDb(resDbName);
    });
}
exports.initResDb = initResDb;
let resDbRunner;
function getResDbRunner() {
    return __awaiter(this, void 0, void 0, function* () {
        if (resDbRunner === undefined) {
            let db = new core_1.Db(resDbName);
            resDbRunner = new core_1.Runner(resDbName, db);
        }
        return resDbRunner;
    });
}
exports.getResDbRunner = getResDbRunner;
//# sourceMappingURL=resDb.js.map