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
const core_1 = require("../core");
const unitxQueueName = 'unitx-in-queue';
let unitxQueue;
function startUnitxQueue(redis) {
    return __awaiter(this, void 0, void 0, function* () {
        unitxQueue = bull(unitxQueueName, redis);
        unitxQueue.on("error", (error) => {
            console.log(unitxQueueName, error);
        });
        unitxQueue.process(function (job, done) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let { data } = job;
                    yield core_1.pushToCenter(data);
                    /*
                    console.log('accept message: ', data);
                    if (data !== undefined) {
                        let {$job, $db, $unit} = data;
                        switch ($job) {
                            case 'sheetMsg':
                                await processSheetMessage($unit, $db, data);
                                break;
                            //case 'sheetMsgDone':
                            //    await removeSheetMessage($unit, data);
                            //    break;
                        }
                    }
                    */
                    done();
                }
                catch (err) {
                    console.error(err);
                    done(new Error(err));
                }
            });
        });
        yield unitxQueue.isReady();
        console.log(unitxQueueName, ' is ready');
        return unitxQueue;
    });
}
exports.startUnitxQueue = startUnitxQueue;
function queueUnitx(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxQueue.add(msg);
    });
}
exports.queueUnitx = queueUnitx;
//# sourceMappingURL=unitxQueue.js.map