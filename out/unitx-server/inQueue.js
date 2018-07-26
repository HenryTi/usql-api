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
const config = require("config");
const runner_1 = require("../tv/runner");
const afterAction_1 = require("../tv/afterAction");
const packParam_1 = require("../core/packParam");
let unitxQueueName = 'unitx-in-queue';
let redis = config.get("redis");
const unitxInQueue = bull(unitxQueueName, redis);
unitxInQueue.isReady().then(q => {
    console.log("queue: %s, redis: %s", unitxQueueName, JSON.stringify(redis));
});
unitxInQueue.process(function (job, done) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { data } = job;
            console.log('accept message: ', data);
            if (data !== undefined) {
                let { $job, $unit } = data;
                switch ($job) {
                    case 'sheet':
                        yield saveSheetMessage($unit, data);
                        break;
                }
            }
            done();
        }
        catch (err) {
            console.error(err);
            done(new Error(err));
        }
    });
});
const $unitDb = '$unitx';
const newMessage = 'newMessage';
function saveSheetMessage(unit, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data } = sheetMessage;
        let runner = yield runner_1.getRunner($unitDb);
        //let ret = await runner.action('newMessage', unit, 1, JSON.stringify(data));
        let toUser = 1;
        let schema = runner.getSchema(newMessage);
        let msg = packParam_1.packParam(schema.call, data);
        let result = yield runner.action(newMessage, unit, toUser, msg);
        let returns = schema.call.returns;
        let { hasSend, busFaces } = schema.run;
        let actionReturn = yield afterAction_1.sendMessagesAfterAction($unitDb, runner, unit, returns, hasSend, busFaces, result);
        console.log('save sheet message ', data);
        return;
    });
}
function addUnitxInQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.addUnitxInQueue = addUnitxInQueue;
//# sourceMappingURL=inQueue.js.map