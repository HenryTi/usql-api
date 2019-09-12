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
function pullBus(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /*
            if (runner.net.isTest === true) {
                if (debugUqs!==undefined && debugUqs.indexOf(runner.uq)>=0) debugger;
            }*/
            let { buses, net } = runner;
            let { faces, coll, hasError } = buses;
            while (hasError === false) {
                let unitMaxIds = yield getSyncUnits(runner);
                let msgCount = 0;
                for (let row of unitMaxIds) {
                    let { unit, maxId } = row;
                    if (maxId === null)
                        maxId = 0;
                    let openApi = yield net.getUnitxApi(unit);
                    if (!openApi)
                        continue;
                    let ret = yield openApi.fetchBus(unit, maxId, faces);
                    let { maxMsgId, maxRows } = ret[0][0];
                    let messages = ret[1];
                    // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                    for (let row of messages) {
                        let { face: faceUrl, id: msgId, body, version } = row;
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
                            yield runner.call('$queue_in_add', [unit, msgId, bus, faceName, body]);
                        }
                        catch (toQueueInErr) {
                            hasError = buses.hasError = true;
                            console.error(toQueueInErr);
                            break;
                        }
                        ++msgCount;
                    }
                    if (hasError === true)
                        break;
                    if (messages.length < maxRows && maxId < maxMsgId) {
                        // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                        //await runner.busSyncMax(unit, maxMsgId);
                    }
                }
                // 如果没有处理任何消息，则退出，等待下一个循环
                if (msgCount === 0)
                    break;
            }
        }
        catch (err) {
            //debugger;
            if (err && err.message)
                console.error(err.message);
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
/*
async function getBusFaces(runner: Runner): Promise<BusFaces> {
    let busFaces:any[] = await runner.call('$bus_faces', []);
    if (busFaces.length === 0) return;
    let faces:string[] = [];
    let faceColl:{[faceUrl:string]: Face} = {};
    let outBusCount = 0;
    busFaces.forEach(v => {
        let {id, bus, busOwner, busName, faceName} = v;
        if (faceName === null) {
            ++outBusCount;
            return;
        }
        let faceUrl = busOwner + '/' + busName + '/' + faceName;
        faces.push(faceUrl);
        faceColl[faceUrl] = v; //{id:id, bus:bus, faceUrl:faceUrl, face:faceName};
    });
    if (faces.length === 0) return;
    return {
        faces: faces.join('\n'),
        faceColl: faceColl,
        outBusCount: outBusCount,
    };
}
*/ 
//# sourceMappingURL=pullBus.js.map