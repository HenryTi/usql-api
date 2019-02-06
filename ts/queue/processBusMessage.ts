import { BusMessage } from "./model";
import { consts } from '../core';
import { getRunner, Runner } from "../db";
import { busQueuehour, busQueueSeedFromHour } from "../core/busQueueSeed";

let faces:{[face:string]:number};
let froms:{[from:string]:number};
let lastHour: number;

async function getFaceId(runner:Runner, unit:number, face:string):Promise<number> {
    if (faces === undefined) {
        faces = {};
        let ret = await runner.tuidGetAll(consts.Face, unit, undefined);
        for (let row of ret) {
            let {id, str} = row;
            faces[str] = id;
        }
    }
    let faceId = faces[face];
    if (faceId === undefined) {
         let ret = await runner.tuidSave(consts.Face, unit, undefined, [undefined, face]);
         if (ret === undefined) return;
         if (ret.length === 0) return;
         let {id} = ret[0];
         if (id<0) id = -id;
         faceId = id;
         faces[face] = faceId;
    }
    return faceId;
}

async function getFromId(runner:Runner, unit:number, from:string):Promise<number> {
    if (froms === undefined) {
        froms = {};
        let ret = await runner.tuidGetAll(consts.BusFrom, unit, undefined);
        for (let row of ret) {
            let {id, str} = row;
            froms[str] = id;
        }
    }
    let fromId = froms[from];
    if (fromId === undefined) {
         let ret = await runner.tuidSave(consts.BusFrom, unit, undefined, [undefined, from, undefined]);
         if (ret === undefined) return;
         if (ret.length === 0) return;
         let {id} = ret[0];
         if (id<0) id = -id;
         fromId = id;
         froms[from] = fromId;
    }
    return fromId;
}

export async function writeDataToBus(runner:Runner, face:string, unit:number, from:string, body:string) {
    let faceId = await getFaceId(runner, unit, face);
    let fromId = await getFromId(runner, unit, from);
    let hour = busQueuehour();
    if (lastHour === undefined || hour > lastHour) {
        await runner.call('$set_bus_queue_seed', ['busqueue', busQueueSeedFromHour(hour)]);
        lastHour = hour;
    }
    var now = new Date();
    await runner.tuidSave(consts.BusQueue, unit, undefined, 
        [undefined, faceId, fromId, body, 
            new Date(now.getTime() + now.getTimezoneOffset() * 60000)]);
}

export async function processBusMessage(msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的uq服务器
    console.log('bus:', msg);
    let runner = await getRunner(consts.$unitx);
    let {unit, body, from, busOwner, bus, face} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    await writeDataToBus(runner, faceUrl, unit, from, body);
}
