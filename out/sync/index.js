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
const open_1 = require("./open");
let isRunning = false;
function sync() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isRunning === true)
            return;
        isRunning = true;
        console.log('sync start at ', new Date().toLocaleTimeString());
        yield open_1.syncDbs();
        isRunning = false;
    });
}
function startSync() {
    if (process.env.NODE_ENV === 'development') {
        //setTimeout(sync, 3000);
    }
    else {
        setInterval(sync, 60000);
    }
}
exports.startSync = startSync;
//# sourceMappingURL=index.js.map