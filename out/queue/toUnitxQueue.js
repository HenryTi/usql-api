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
const bull = require("bull");
const sendToUnitx_1 = require("./sendToUnitx");
const runner_1 = require("../db/runner");
const toUnitxQueueName = 'to-unitx-queue';
let toUnitxQueue;
function queueToUnitx(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield toUnitxQueue.add(msg);
    });
}
exports.queueToUnitx = queueToUnitx;
function startToUnitxQueue(redis) {
    toUnitxQueue = bull(toUnitxQueueName, redis);
    toUnitxQueue.on("error", (error) => {
        console.log(toUnitxQueueName, error);
    });
    toUnitxQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { data } = job;
                yield sendMsgToUnitx(data);
                done();
            }
            catch (err) {
                console.error(err);
                done(new Error(err));
            }
        });
    });
    console.log('QUEUE: ' + toUnitxQueueName);
}
exports.startToUnitxQueue = startToUnitxQueue;
function sendMsgToUnitx(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let { unit } = msg;
        let toArr = yield sendToUnitx_1.sendToUnitx(unit, msg);
        let { type } = msg;
        if (type !== 'sheet')
            return;
        let sheetMsg = msg;
        if (toArr === undefined)
            return;
        if (toArr.length === 0)
            return;
        let { db, body } = sheetMsg;
        let runner = yield runner_1.getRunner(db);
        if (runner === undefined)
            return;
        let { id } = body;
        let user = 0; // 操作uq，必须有操作人，系统操作=0
        yield runner.sheetTo(unit, user, id, toArr);
        console.log('sheet to unitx', msg);
    });
}
//# sourceMappingURL=toUnitxQueue.js.map