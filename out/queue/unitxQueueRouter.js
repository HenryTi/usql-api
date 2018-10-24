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
const express_1 = require("express");
const runner_1 = require("../db/runner");
const unitxInQueue_1 = require("./unitxInQueue");
exports.unitxQueueRouter = express_1.Router();
exports.unitxQueueRouter.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let msg = req.body;
        let tos = undefined;
        let { type } = msg;
        if (type === 'sheet') {
            let sheetMessage = msg;
            let { from } = sheetMessage;
            tos = yield getSheetTos(sheetMessage);
            if (tos.length === 0)
                tos = [from];
            sheetMessage.to = tos;
        }
        yield unitxInQueue_1.queueUnitxIn(msg);
        res.json({
            ok: true,
            res: tos,
        });
    }
    catch (e) {
        res.json({
            ok: false,
            error: JSON.stringify(e),
        });
    }
}));
const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlGetSheetTo = 'getSheetTo';
function getSheetTos(sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner($unitx);
        let { unit, body } = sheetMessage;
        let { state, user, name, no, discription, usq } = body;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [usq, sheetName, stateName];
        let tos = yield runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
        return tos.map(v => v.to);
    });
}
//# sourceMappingURL=unitxQueueRouter.js.map