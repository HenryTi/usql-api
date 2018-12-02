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
let BusTypes;
let lastHour;
function processBusMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的usq服务器
        console.log('bus:', msg);
        let { $unitx, BusQueue, BusType } = core_1.consts;
        let runner = yield db_1.getRunner($unitx);
        if (BusTypes === undefined) {
            BusTypes = {};
            let ret = yield runner.tuidGetAll(BusType, undefined, undefined);
            for (let row of ret) {
                let { id, type } = row;
                BusTypes[type] = id;
            }
        }
        let { unit, body, busOwner, bus, face } = msg;
        let busUrl = busOwner + '/' + bus;
        let busTypeId = BusTypes[busUrl];
        if (busTypeId === undefined) {
            let ret = yield runner.tuidSave(BusType, undefined, undefined, [undefined, busUrl]);
            busTypeId = ret[0].id;
            BusTypes[busUrl] = busTypeId;
        }
        let hour = Math.floor(Date.now() / (3600 * 1000));
        if (lastHour === undefined || hour > lastHour) {
            yield runner.call('$set_bus_queue_seed', ['busqueue', hour * 1000000000]);
            lastHour = hour;
        }
        yield runner.tuidSave(BusQueue, unit, undefined, [undefined, unit, busTypeId, body]);
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map