import { Runner, consts, Net } from "../core";
//import { OpenApi } from "../core/openApi";
//import { getOpenApi } from "./openApi";

/*
interface SyncFace {
    unit: number;
    faces: string;
    faceUnitMessages: string;
}
*/

export async function syncBus(runner: Runner,  net: Net) {
    try {
        let {buses} = runner;
        let {faces, coll, hasError} = buses;
        while (hasError === false) {
            let unitMaxIds:{unit:number; maxId:number}[] = await getSyncUnits(runner);
            let msgCount = 0;
            for (let row of unitMaxIds) {
                let {unit, maxId} = row;
                if (maxId === null) maxId = 0;
                let openApi = await net.getUnitxApi(unit);
                if (!openApi) continue;
                let ret = await openApi.fetchBus(unit, maxId, faces);
                let {maxMsgId, maxRows} = ret[0][0];
                let messages = ret[1];
                for (let row of messages) {
                    let {face:faceUrl, id:msgId, body} = row;
                    let face = coll[faceUrl];
                    let {bus, faceName} = face;
                    try {
                        await runner.bus(bus, faceName, unit, msgId, body);
                    }
                    catch (busErr) {
                        hasError = buses.hasError = true;
                        console.error(busErr);
                        break;
                    }
                    ++msgCount;
                }
                if (hasError === true) break;
                if (messages.length < maxRows && maxId < maxMsgId) {
                    // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                    await runner.busSyncMax(unit, maxMsgId);
                }
            }
            // 如果没有处理任何消息，则退出，等待下一个循环
            if (msgCount === 0) break;

            /*
            let count = 0;
            let {faceColl, syncFaceArr} = syncFaces;
            for (let syncFace of syncFaceArr) {
                let {unit, faces, faceUnitMessages} = syncFace;
                let openApi = await net.getOpenApi(consts.$$$unitx, unit);
                let ret = await openApi.bus(unit, faces, faceUnitMessages);
                let retLen = ret.length
                if (retLen === 0) continue;
                count += retLen;
                for (let row of ret) {
                    let {face:faceUrl, id:msgId, body} = row;
                    let {bus, face, id:faceId} = faceColl[faceUrl];
                    await runner.bus(bus, face, unit, faceId, msgId, body);
                }
            }
            if (count === 0) break;
            */
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