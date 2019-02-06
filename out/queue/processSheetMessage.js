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
const db_1 = require("../db");
const pushToClient_1 = require("./pushToClient");
const actionProcess_1 = require("../router/actionProcess");
const core_1 = require("../core");
function processSheetMessage(sheetMsg) {
    return __awaiter(this, void 0, void 0, function* () {
        let { $unitx, sheetMessage } = core_1.consts;
        let { unit, body, to } = sheetMsg;
        let { id, discription, no, state, app, uq, sheet } = body;
        let runner = yield db_1.getRunner($unitx);
        let content = {
            app: app,
            id: id,
            uq: uq,
            sheet: sheet
        };
        let msgBody = {
            subject: discription,
            discription: no + ' - ' + state,
            content: JSON.stringify(content),
            uq: uq,
            sheet: id,
            state: state,
            tos: to.map(v => { return { to: v }; }),
        };
        let schema = runner.getSchema(sheetMessage);
        let call = schema.call;
        let run = schema.run;
        let user = 0;
        // 保存单据消息
        // 保存之后，发送desk消息到home
        yield actionProcess_1.actionProcess(unit, user, sheetMessage, $unitx, undefined, runner, msgBody, call, run);
        // 单据处理的消息发送到前台
        yield pushToClient_1.pushToClient(sheetMsg);
    });
}
exports.processSheetMessage = processSheetMessage;
//# sourceMappingURL=processSheetMessage.js.map