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
exports.execQueueAct = void 0;
const tool_1 = require("../tool");
function execQueueAct(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        if (runner.execQueueActError === true)
            return;
        try {
            for (let i = 0; i < 20; i++) {
                let ret = yield runner.call('$exec_queue_act', []);
                if (!ret)
                    break;
                if (ret.length === 0)
                    break;
                let row = ret[0];
                if (Array.isArray(row) === true) {
                    if (row.length === 0)
                        break;
                    row = row[0];
                }
                if (!row)
                    break;
            }
        }
        catch (err) {
            tool_1.logger.error(`execQueueAct: `, err);
            runner.execQueueActError = true;
        }
    });
}
exports.execQueueAct = execQueueAct;
//# sourceMappingURL=execQueueAct.js.map