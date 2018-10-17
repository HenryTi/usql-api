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
const _1 = require(".");
function pushToCenter(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield _1.centerApi.pushTo(msg);
            let s = null;
            console.log('message push to center:', msg);
        }
        catch (e) {
            console.error('ws send message to center:', e);
        }
    });
}
exports.pushToCenter = pushToCenter;
//# sourceMappingURL=pushToCenter.js.map