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
const syncDbs_1 = require("./syncDbs");
function startSync() {
    let timeout = process.env.NODE_ENV === 'development' ?
        6000 : 60 * 1000;
    setTimeout(sync, timeout);
}
exports.startSync = startSync;
function sync() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('sync at: ' + new Date().toLocaleTimeString());
            yield syncDbs_1.syncDbs();
        }
        catch (err) {
            console.error('sync error: ', err);
        }
        finally {
            setTimeout(sync, 60 * 1000);
        }
    });
}
//# sourceMappingURL=index.js.map