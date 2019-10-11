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
const core_1 = require("../../core");
let faces;
let froms;
let lastHour = 0;
function getFaceId(runner, unit, face) {
    return __awaiter(this, void 0, void 0, function* () {
        if (faces === undefined) {
            faces = {};
            let ret = yield runner.tuidGetAll(core_1.consts.Face, unit, undefined);
            for (let row of ret) {
                let { id, str } = row;
                faces[str] = id;
            }
        }
        let faceId = faces[face];
        if (faceId === undefined) {
            let ret = yield runner.tuidSave(core_1.consts.Face, unit, undefined, [undefined, face]);
            if (ret === undefined)
                return;
            if (ret.length === 0)
                return;
            let { id } = ret[0];
            if (id < 0)
                id = -id;
            faceId = id;
            faces[face] = faceId;
        }
        return faceId;
    });
}
function getFromId(runner, unit, from) {
    return __awaiter(this, void 0, void 0, function* () {
        if (froms === undefined) {
            froms = {};
            let ret = yield runner.tuidGetAll(core_1.consts.BusFrom, unit, undefined);
            for (let row of ret) {
                let { id, str } = row;
                froms[str] = id;
            }
        }
        let fromId = froms[from];
        if (fromId === undefined) {
            let ret = yield runner.tuidSave(core_1.consts.BusFrom, unit, undefined, [undefined, from, undefined]);
            if (ret === undefined)
                return;
            if (ret.length === 0)
                return;
            let { id } = ret[0];
            if (id < 0)
                id = -id;
            fromId = id;
            froms[from] = fromId;
        }
        return fromId;
    });
}
function writeDataToBus(runner, face, unit, from, fromQueueId, version, body) {
    return __awaiter(this, void 0, void 0, function* () {
        /*
        let faceId = await getFaceId(runner, unit, face);
        let fromId = await getFromId(runner, unit, from);
            
        await runner.tuidSave(consts.BusQueue, unit, undefined,
            [undefined, faceId, fromId, fromQueueId, version, body]);
        */
        let hour = core_1.busQueuehour();
        if (hour > lastHour) {
            let seed = core_1.busQueueSeedFromHour(hour);
            let seedRet = yield runner.call('$get_table_seed', ['busqueue']);
            let s = seedRet[0].seed;
            if (!s)
                s = 1;
            if (seed > s) {
                yield runner.call('$set_bus_queue_seed', ['busqueue', seed]);
            }
            lastHour = hour;
        }
        yield runner.actionDirect('writebusqueue', unit, undefined, face, from, fromQueueId, version, body);
    });
}
exports.writeDataToBus = writeDataToBus;
function processBusMessage(unitxRunner, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的uq服务器
        console.log('bus:', msg);
        //let unitxRunner = await getRunner(consts.$unitx);
        let { unit, body, from, queueId, busOwner, bus, face, version } = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        yield writeDataToBus(unitxRunner, faceUrl, unit, from, queueId, version, body);
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map