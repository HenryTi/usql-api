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
const node_fetch_1 = require("node-fetch");
const core_1 = require("../core");
const runner_1 = require("./runner");
const unitxColl = {};
const sheetToUnitxQueueName = 'sheet-to-unitx-queue';
const busToUnitxQueueName = 'bus-to-unitx-queue';
let sheetQueue;
let busQueue;
function queueSheetToUnitx(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield sheetQueue.add(msg);
    });
}
exports.queueSheetToUnitx = queueSheetToUnitx;
function queueBusToUnitx(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield busQueue.add(msg);
    });
}
exports.queueBusToUnitx = queueBusToUnitx;
function startSheetToUnitxQueue(redis) {
    return __awaiter(this, void 0, void 0, function* () {
        sheetQueue = bull(sheetToUnitxQueueName, redis);
        sheetQueue.on("error", (error) => {
            console.log('queue server: ', error);
        });
        sheetQueue.process(function (job, done) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let data = job.data;
                    if (data !== undefined) {
                        let { $unit, $db } = data;
                        yield sheetToUnitx($unit, $db, data);
                    }
                    done();
                }
                catch (e) {
                    console.error(e);
                    done();
                }
            });
        });
        yield sheetQueue.isReady();
        console.log(sheetToUnitxQueueName, ' is ready');
        return sheetQueue;
    });
}
exports.startSheetToUnitxQueue = startSheetToUnitxQueue;
;
function startBusToUnitxQueue(redis) {
    return __awaiter(this, void 0, void 0, function* () {
        busQueue = bull(busToUnitxQueueName, redis);
        busQueue.on("error", (error) => {
            console.log('queue server: ', error);
        });
        busQueue.process(function (job, done) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let data = job.data;
                    if (data !== undefined) {
                        let { $unit, $db } = data;
                        yield busToDest($unit, data);
                    }
                    done();
                }
                catch (e) {
                    console.error(e);
                    done();
                }
            });
        });
        yield busQueue.isReady();
        console.log(busToUnitxQueueName, ' is ready');
        return busQueue;
    });
}
exports.startBusToUnitxQueue = startBusToUnitxQueue;
function sheetToUnitx(unit, db, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let unitxUrl = yield getUnitxUrl(unit);
        if (unitxUrl === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let unitx = new core_1.UnitxApi(unitxUrl);
        let toArr = yield unitx.sheet(msg);
        let runner = yield runner_1.getRunner(db);
        if (runner !== undefined) {
            let sheetId = msg.id;
            let user = undefined;
            if (toArr !== undefined && toArr.length > 0) {
                yield runner.sheetTo(unit, user, sheetId, toArr);
            }
        }
        console.log('sheet to unitx', msg);
    });
}
function getUnitxUrl(unit) {
    return __awaiter(this, void 0, void 0, function* () {
        let unitxUrl = unitxColl[unit];
        if (unitxUrl !== undefined)
            return unitxUrl;
        let unitx = yield core_1.centerApi.unitx(unit);
        if (unitx === undefined)
            return unitxColl[unit] = null;
        let { url, urlDebug } = unitx;
        if (urlDebug !== undefined) {
            try {
                urlDebug = core_1.urlSetUnitxHost(urlDebug);
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        return unitxColl[unit] = url;
    });
}
function busToDest(unit, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { busOwner, bus, face } = msg;
            let ret = yield core_1.centerApi.unitxBuses(unit, busOwner, bus, face);
            for (let service of ret) {
                let { url } = service;
                let unitx = new core_1.UnitxApi(url);
                yield unitx.bus(msg);
                console.log('bus to ', url, msg);
            }
        }
        catch (e) {
            console.error(e);
        }
    });
}
// 试试redis server，报告是否工作
function trySheetToUnitxQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let job = yield sheetQueue.add({ job: undefined });
            try {
                yield job.remove();
                console.log('redis server ok!');
            }
            catch (err) {
                console.log('redis server job.remove error: ' + err);
            }
        }
        catch (reason) {
            console.log('redis server error: ', reason);
        }
        ;
    });
}
exports.trySheetToUnitxQueue = trySheetToUnitxQueue;
//# sourceMappingURL=toUnitxQueue.js.map