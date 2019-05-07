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
const queue_1 = require("../queue");
const core_1 = require("../core");
function actionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data } = body;
        if (data === undefined) {
            console.log('action process data: ', body);
            data = core_1.packParam(schema, body);
        }
        console.log('action process param: ', data);
        let result = yield runner.action(name, unit, user, data);
        let returns = schema.returns;
        let { hasSend, busFaces } = run;
        let actionReturn = yield queue_1.afterAction(db, runner, unit, returns, hasSend, busFaces, result);
        return actionReturn;
    });
}
exports.actionProcess = actionProcess;
;
//# sourceMappingURL=actionProcess.js.map