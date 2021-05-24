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
exports.pullBus = void 0;
const tool_1 = require("../tool");
const tool_2 = require("../tool");
function pullBus(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { buses, net } = runner;
            let { faces, coll, hasError } = buses;
            let pullBusItemCount = 0;
            while (hasError === false && pullBusItemCount < 200) {
                let unitMaxIds = yield getSyncUnits(runner);
                let msgCount = 0;
                for (let row of unitMaxIds) {
                    let { unit, maxId } = row;
                    if (maxId === null)
                        maxId = 0;
                    let ret = yield net.pullBus(unit, maxId, faces);
                    if (!ret)
                        continue;
                    let { maxMsgId, maxRows } = ret[0][0];
                    let messages = ret[1];
                    let { length: messagesLen } = messages;
                    if (messagesLen > 0) {
                        // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                        tool_1.logger.log(`total ${messagesLen} arrived from unitx`);
                        for (let row of messages) {
                            let { to, face: faceUrl, id: msgId, body, version } = row;
                            let face = coll[faceUrl.toLowerCase()];
                            if (face === undefined)
                                continue;
                            let { bus, faceName, version: runnerBusVersion } = face;
                            try {
                                if (runnerBusVersion !== version) {
                                    // 也就是说，bus消息的version，跟runner本身的bus version有可能不同
                                    // 不同需要做数据转换
                                    // 但是，现在先不处理
                                    // 2019-07-23
                                }
                                yield runner.call('$queue_in_add', [unit, to, msgId, bus, faceName, body]);
                                ++pullBusItemCount;
                            }
                            catch (toQueueInErr) {
                                hasError = buses.hasError = true;
                                tool_1.logger.error(toQueueInErr);
                                yield runner.log(unit, 'jobs pullBus loop to QueueInErr msgId=' + msgId, tool_2.getErrorString(toQueueInErr));
                                break;
                            }
                            ++msgCount;
                        }
                        if (hasError === true)
                            break;
                    }
                    if (messagesLen < maxRows && maxId < maxMsgId) {
                        // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                        yield runner.call('$queue_in_add', [unit, undefined, maxMsgId, undefined, undefined, undefined]);
                        //await runner.busSyncMax(unit, maxMsgId);
                    }
                }
                // 如果没有处理任何消息，则退出，等待下一个循环
                if (msgCount === 0)
                    break;
            }
        }
        catch (err) {
            tool_1.logger.error(err);
            yield runner.log(0, 'jobs pullBus loop error: ', tool_2.getErrorString(err));
        }
    });
}
exports.pullBus = pullBus;
function getSyncUnits(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let syncUnits = yield runner.call('$sync_units', []);
        return syncUnits;
    });
}
//# sourceMappingURL=pullBus.js.map