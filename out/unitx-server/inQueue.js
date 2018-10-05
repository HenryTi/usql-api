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
const processSheetMessage_1 = require("./processSheetMessage");
const unitxQueueName = 'unitx-in-queue';
let unitxInQueue;
function startUnitxInQueue(redis) {
    unitxInQueue = bull(unitxQueueName, redis);
    unitxInQueue.isReady().then(q => {
        console.log(unitxQueueName, ' is ready');
    });
    unitxInQueue.on("error", (error) => {
        console.log(unitxQueueName, error);
    });
    unitxInQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { data } = job;
                console.log('accept message: ', data);
                if (data !== undefined) {
                    let { $job, $unit } = data;
                    switch ($job) {
                        case 'sheetMsg':
                            yield processSheetMessage_1.processSheetMessage($unit, data);
                            break;
                        //case 'sheetMsgDone':
                        //    await removeSheetMessage($unit, data);
                        //    break;
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
}
exports.startUnitxInQueue = startUnitxInQueue;
function addUnitxInQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.addUnitxInQueue = addUnitxInQueue;
//# sourceMappingURL=inQueue.js.map