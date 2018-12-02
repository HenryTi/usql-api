import { BusMessage } from "./model";
import { consts, packParam } from '../core';
import { getRunner } from "../db";

let BusTypes:{[BusType:string]:number};
let lastHour: number;

export async function processBusMessage(msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的usq服务器
    console.log('bus:', msg);
    let {$unitx, BusQueue, BusType} = consts;
    let runner = await getRunner($unitx);
    if (BusTypes === undefined) {
        BusTypes = {};
        let ret = await runner.tuidGetAll(BusType, undefined, undefined);
        for (let row of ret) {
            let {id, type} = row;
            BusTypes[type] = id;
        }
    }
    let {unit, body, busOwner, bus, face} = msg;
    let busUrl = busOwner + '/' + bus;
    let busTypeId = BusTypes[busUrl];
    if (busTypeId === undefined) {
         let ret = await runner.tuidSave(BusType, undefined, undefined, [undefined, busUrl]);
         busTypeId = ret[0].id;
         BusTypes[busUrl] = busTypeId;
    }

    let hour = Math.floor(Date.now()/(3600*1000));
    if (lastHour === undefined || hour > lastHour) {
        await runner.call('$set_bus_queue_seed', ['busqueue', hour*1000000000]);
        lastHour = hour;
    }
    await runner.tuidSave(BusQueue, unit, undefined, [undefined, unit, busTypeId, body]);
}
