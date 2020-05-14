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
//let lastHour: number = 0;
function writeDataToBus(runner, face, unit, from, fromQueueId, version, body) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        let hour = busQueuehour();
        if (hour > lastHour) {
            let seed = busQueueSeedFromHour(hour);
            let seedRet = await runner.call('$get_table_seed', ['busqueue']);
            let s = seedRet[0].seed;
            if (!s) s = 1;
            if (seed > s) {
                await runner.call('$set_bus_queue_seed', ['busqueue', seed]);
            }
            lastHour = hour;
        }
        */
        console.log('writebusqueue', face, from, body);
        yield runner.actionDirect('writebusqueue', unit, undefined, face, from, fromQueueId, version, body);
    });
}
exports.writeDataToBus = writeDataToBus;
function processBusMessage(unitxRunner, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的uq服务器
        let { unit, body, from, queueId, busOwner, bus, face, version } = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        yield writeDataToBus(unitxRunner, faceUrl, unit, from, queueId, version, body);
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map