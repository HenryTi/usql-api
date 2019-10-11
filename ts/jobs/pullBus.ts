import { Runner, Net } from "../core";
import { bench } from "./debugUqs";

export async function pullBus(runner: Runner) {
    try {
        /*
        if (runner.net.isTest === true) {
            if (debugUqs!==undefined && debugUqs.indexOf(runner.uq)>=0) debugger;
        }*/
        let {buses, net} = runner;
        let {faces, coll, hasError} = buses;
        while (hasError === false) {
            bench.start('pullBus getSyncUnits(runner)');
            let unitMaxIds:{unit:number; maxId:number}[] = await getSyncUnits(runner);
            bench.log();
            let msgCount = 0;
            for (let row of unitMaxIds) {
                let {unit, maxId} = row;
                if (maxId === null) maxId = 0;
                bench.start('pullBus net.getUnitxApi(unit)')
                let openApi = await net.getUnitxApi(unit);
                bench.log();
                if (!openApi) continue;
                bench.start('pullBus openApi.fetchBus(unit, maxId, faces)')
                let ret = await openApi.fetchBus(unit, maxId, faces);
                bench.log();
                let {maxMsgId, maxRows} = ret[0][0];
                let messages = ret[1];
                // 新版：bus读来，直接写入queue_in。然后在队列里面处理
                for (let row of messages) {
                    let {face:faceUrl, id:msgId, body, version} = row;
                    let face = coll[(faceUrl as string).toLowerCase()];
                    if (face === undefined) continue;
                    let {bus, faceName, version:runnerBusVersion} = face;
                    try {
                        if (runnerBusVersion !== version) {
                            // 也就是说，bus消息的version，跟runner本身的bus version有可能不同
                            // 不同需要做数据转换
                            // 但是，现在先不处理
                            // 2019-07-23
                        }
                        bench.start('pullBus runner.call("$queue_in_add", [unit, msgId, bus, faceName, body])')
                        await runner.call('$queue_in_add', [unit, msgId, bus, faceName, body]);
                        bench.log();
                    }
                    catch (toQueueInErr) {
                        hasError = buses.hasError = true;
                        console.error(toQueueInErr);
                        break;
                    }
                    ++msgCount;
                }
                if (hasError === true) break;
                if (messages.length < maxRows && maxId < maxMsgId) {
                    // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                    //await runner.busSyncMax(unit, maxMsgId);
                }
            }
            // 如果没有处理任何消息，则退出，等待下一个循环
            if (msgCount === 0) break;
        }
    }
    catch (err) {
        //debugger;
        if (err && err.message) console.error(err.message);
    }
}

async function getSyncUnits(runner: Runner): Promise<any[]> {
    let syncUnits = await runner.call('$sync_units', []);
    return syncUnits;
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