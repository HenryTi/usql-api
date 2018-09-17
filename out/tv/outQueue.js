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
const unitxColl = {};
const outQueueName = 'out-queue';
let outQueue;
function startOutQueue(redis) {
    outQueue = bull(outQueueName, redis);
    outQueue.isReady().then(q => {
        console.log(outQueueName, ' is ready');
    });
    outQueue.on("error", (error) => {
        console.log('queue server: ', error);
    });
    outQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let data = job.data;
                if (data !== undefined) {
                    let { $job, $unit } = data;
                    switch ($job) {
                        case 'sheetMsg':
                            yield sheetToUnitx($unit, data);
                            break;
                        case 'bus':
                            yield busToDest($unit, data);
                            break;
                    }
                }
                done();
            }
            catch (e) {
                console.error(e);
            }
        });
    });
}
exports.startOutQueue = startOutQueue;
function sheetToUnitx(unit, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        //let {unit, busOwner, bus, face, data} = jobData;
        let unitxUrl = yield getUnitxUrl(unit);
        if (unitxUrl === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let unitx = new core_1.UnitxApi(unitxUrl);
        yield unitx.send(msg);
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
                let usqlApi = new core_1.UnitxApi(url);
                yield usqlApi.send(msg);
                console.log('bus to ', url, msg);
            }
        }
        catch (e) {
            console.error(e);
        }
    });
}
function addOutQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield outQueue.add(msg);
    });
}
exports.addOutQueue = addOutQueue;
// 试试redis server，报告是否工作
function tryoutQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let job = yield outQueue.add({ job: undefined });
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
exports.tryoutQueue = tryoutQueue;
//# sourceMappingURL=outQueue.js.map