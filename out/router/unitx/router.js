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
exports.buildUnitxRouter = void 0;
const express_1 = require("express");
const tool_1 = require("../../tool");
const core_1 = require("../../core");
const messageProcesser_1 = require("./messageProcesser");
const processBusMessage_1 = require("./processBusMessage");
function buildUnitxRouter(rb) {
    let router = express_1.Router();
    router.post('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            let msg = req.body;
            let tos = undefined;
            let { type } = msg;
            let unitxRunner = yield rb.getUnitxRunner();
            if (type === 'sheet') {
                let sheetMessage = msg;
                let { from } = sheetMessage;
                tos = yield getSheetTos(unitxRunner, sheetMessage);
                if (tos === undefined || tos.length === 0)
                    tos = [from];
                sheetMessage.to = tos;
            }
            let mp = messageProcesser_1.messageProcesser(msg);
            yield mp(unitxRunner, msg);
            res.json({
                ok: true,
                res: tos,
            });
        }
        catch (e) {
            let err = JSON.stringify(e);
            tool_1.logger.error('unitx-error: ', err);
            res.json({
                ok: false,
                error: err,
            });
        }
    }));
    let fetchBus = (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, msgStart, faces } = body;
        let ret = yield runner.unitUserTablesFromProc('tv_GetBusMessages', unit, undefined, msgStart, faces);
        return ret;
    });
    rb.post(router, '/fetch-bus', fetchBus);
    let jointReadBus = (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, queue } = body;
        if (queue === undefined)
            queue = core_1.busQueueSeed();
        let ret = yield runner.unitUserCall('tv_BusMessageFromQueue', unit, undefined, face, queue);
        if (ret.length === 0)
            return;
        return ret[0];
    });
    rb.post(router, '/joint-read-bus', jointReadBus);
    let jointWriteBus = (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, to, from, fromQueueId, version, body: message } = body;
        let ret = yield processBusMessage_1.writeDataToBus(runner, face, unit, to, from, fromQueueId, version, message);
        if (ret < 0) {
            tool_1.logger.error('writeDataToBus message duplicated!', body, -ret);
        }
        return ret;
    });
    rb.post(router, '/joint-write-bus', jointWriteBus);
    return router;
}
exports.buildUnitxRouter = buildUnitxRouter;
// 之前用 getSheetTo 查询，现在改名为 getEntityAccess
const uqGetSheetTo = 'getEntityAccess';
function getSheetTos(unitxRunner, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let { unit, body } = sheetMessage;
        let { state, user, name, no, discription, uq } = body;
        // 新单只能发给做单人
        if (state === '$')
            return;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [uq, sheetName, stateName];
        let tos = yield unitxRunner.query(uqGetSheetTo, unit, user, paramsGetSheetTo);
        return tos.map(v => v.to);
    });
}
//# sourceMappingURL=router.js.map