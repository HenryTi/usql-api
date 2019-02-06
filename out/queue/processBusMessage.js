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
const core_1 = require("../core");
const db_1 = require("../db");
const busQueueSeed_1 = require("../core/busQueueSeed");
let faces;
let froms;
let lastHour;
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
function writeDataToBus(runner, face, unit, from, body) {
    return __awaiter(this, void 0, void 0, function* () {
        let faceId = yield getFaceId(runner, unit, face);
        let fromId = yield getFromId(runner, unit, from);
        let hour = busQueueSeed_1.busQueuehour();
        if (lastHour === undefined || hour > lastHour) {
            yield runner.call('$set_bus_queue_seed', ['busqueue', busQueueSeed_1.busQueueSeedFromHour(hour)]);
            lastHour = hour;
        }
        var now = new Date();
        yield runner.tuidSave(core_1.consts.BusQueue, unit, undefined, [undefined, faceId, fromId, body,
            new Date(now.getTime() + now.getTimezoneOffset() * 60000)]);
    });
}
exports.writeDataToBus = writeDataToBus;
function processBusMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的uq服务器
        console.log('bus:', msg);
        let runner = yield db_1.getRunner(core_1.consts.$unitx);
        let { unit, body, from, busOwner, bus, face } = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        yield writeDataToBus(runner, faceUrl, unit, from, body);
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map