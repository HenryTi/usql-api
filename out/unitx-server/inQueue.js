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
const core_1 = require("../core");
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
            //sendToDest(data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            done();
        }
    });
});
function sendToDest(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { unit, busOwner, bus, face } = msg;
            let ret = yield core_1.centerApi.unitxBuses(unit, busOwner, bus, face);
            for (let service of ret) {
                let usqlApi = new core_1.UnitxApi(service.url);
                yield usqlApi.send(msg);
            }
            let s = null;
        }
        catch (e) {
            console.error(e);
        }
    });
}
function addUnitxInQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.addUnitxInQueue = addUnitxInQueue;
//# sourceMappingURL=inQueue.js.map