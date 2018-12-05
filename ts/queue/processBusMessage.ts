import { BusMessage } from "./model";
import { consts } from '../core';
import { getRunner, Runner } from "../db";

let Faces:{[Face:string]:number};
let lastHour: number;

export async function writeDataToBus(runner:Runner, face:string, unit:number, from:string, body:string) {
    if (Faces === undefined) {
        Faces = {};
        let ret = await runner.tuidGetAll(consts.Face, undefined, undefined);
        for (let row of ret) {
            let {id, str} = row;
            Faces[str] = id;
        }
    }
    let faceId = Faces[face];
    if (faceId === undefined) {
         let ret = await runner.tuidSave(consts.Face, undefined, undefined, [undefined, face]);
         if (ret === undefined) return;
         if (ret.length === 0) return;
         let {id} = ret[0];
         if (id<0) id = -id;
         faceId = id;
         Faces[face] = faceId;
    }

    let hour = Math.floor(Date.now()/(3600*1000));
    if (lastHour === undefined || hour > lastHour) {
        await runner.call('$set_bus_queue_seed', ['busqueue', hour*1000000000]);
        lastHour = hour;
    }
    var now = new Date();
    await runner.tuidSave(consts.BusQueue, unit, undefined, 
        [undefined, unit, faceId, from, body, 
            new Date(now.getTime() + now.getTimezoneOffset() * 60000)]);
}

export async function processBusMessage(msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的usq服务器
    console.log('bus:', msg);
    let runner = await getRunner(consts.$unitx);
    let {unit, body, from, busOwner, bus, face} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    await writeDataToBus(runner, faceUrl, unit, from, body);
    /*
    if (Faces === undefined) {
        Faces = {};
        let ret = await runner.tuidGetAll(Face, undefined, undefined);
        for (let row of ret) {
            let {id, type} = row;
            Faces[type] = id;
        }
    }
    let {unit, body, busOwner, bus, face} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    let faceId = Faces[faceUrl];
    if (faceId === undefined) {
         let ret = await runner.tuidSave(Face, undefined, undefined, [undefined, faceUrl]);
         faceId = ret[0].id;
         Faces[faceUrl] = faceId;
    }

    let hour = Math.floor(Date.now()/(3600*1000));
    if (lastHour === undefined || hour > lastHour) {
        await runner.call('$set_bus_queue_seed', ['busqueue', hour*1000000000]);
        lastHour = hour;
    }
    await runner.tuidSave(BusQueue, unit, undefined, [undefined, unit, faceId, body]);
    */
}
