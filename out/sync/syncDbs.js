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
const db_1 = require("../db/db");
const db_2 = require("../db");
const syncBus_1 = require("./syncBus");
const syncTuids_1 = require("./syncTuids");
const dbRun = new db_1.Db(undefined);
function syncDbs() {
    return __awaiter(this, void 0, void 0, function* () {
        let dbs = yield dbRun.uqDbs();
        for (let row of dbs) {
            let { db } = row;
            if (db.substr(0, 1) === '$')
                continue;
            console.log('---- sync db: ' + db);
            yield syncFroms(db);
        }
        return;
    });
}
exports.syncDbs = syncDbs;
function syncFroms(db) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield db_2.getRunner(db);
        if (runner === undefined)
            return;
        yield syncTuids_1.syncTuids(runner);
        yield syncBus_1.syncBus(runner);
    });
}
//# sourceMappingURL=syncDbs.js.map