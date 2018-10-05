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
const inQueue_1 = require("./inQueue");
const processSheetMessage_1 = require("./processSheetMessage");
exports.unitxRouter = express_1.Router();
exports.unitxRouter.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    let body = req.body;
    let s = null;
    try {
        let msg = req.body;
        //let runner = getRunner('$unitx');
        //await runner.unitxMessage(msg);
        //debugger; // 应该在$unitx数据库中，建立一个action
        // 实际上不入库，只是加入queue
        //(msg as any).job = 'unitx';
        let { $job, $unit } = msg;
        if ($job === 'sheetMsg') {
            let tos = yield processSheetMessage_1.processSheetMessage($unit, msg);
            res.json({
                ok: true,
                res: tos,
            });
        }
        else {
            yield inQueue_1.addUnitxInQueue(msg);
            res.json({
                ok: true,
            });
        }
    }
    catch (e) {
        res.json({
            ok: false,
            error: JSON.stringify(e),
        });
    }
}));
//# sourceMappingURL=router.js.map