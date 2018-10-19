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
const pushToClient_1 = require("./pushToClient");
const unitxInQueueName = 'unitx-in-queue';
let unitxInQueue;
function queueUnitxIn(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.queueUnitxIn = queueUnitxIn;
function startUnitxInQueue(redis) {
    unitxInQueue = bull(unitxInQueueName, redis);
    unitxInQueue.on("error", (error) => {
        console.log(unitxInQueueName, error);
    });
    unitxInQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { data } = job;
                switch (data.type) {
                    case 'sheet':
                    case 'msg':
                        yield pushToClient_1.pushToClient(data);
                        break;
                    case 'bus':
                        yield processBusMessage(data);
                        break;
                }
                /*
                console.log('pushToCenter start');
                await pushToCenter(data);
                console.log('pushToCenter:', data);
                */
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
    console.log('QUEUE: ' + unitxInQueueName);
}
exports.startUnitxInQueue = startUnitxInQueue;
function processBusMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的usq服务器
        throw 'bus message in UnitxIn not implement';
    });
}
//# sourceMappingURL=unitxInQueue.js.map