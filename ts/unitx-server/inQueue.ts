import * as bull from 'bull';
import * as config from 'config';
import { centerApi, UnitxApi } from '../core';

let unitxQueueName = 'unitx-in-queue';
let redis = config.get<any>("redis");
const unitxInQueue = bull(unitxQueueName, redis);

unitxInQueue.isReady().then(q => {
    console.log("queue: %s, redis: %s", unitxQueueName, JSON.stringify(redis));
});

unitxInQueue.process(async function(job, done) {
    try {
        let {data} = job;
        console.log('accept message: ', data);
        //sendToDest(data);
    }
    catch(err) {
        console.error(err);
    }
    finally {
        done();
    }
});

export interface UnitxMessage {
    service:string;
    unit:number;
    busOwner:string;
    bus:string;
    face:string;
    data:any[];
}

async function sendToDest(msg:UnitxMessage):Promise<void> {
    try {
        let {unit, busOwner, bus, face} = msg;
        let ret = await centerApi.unitxBuses(unit, busOwner, bus, face);
        for (let service of ret) {
            let usqlApi = new UnitxApi(service.url);
            await usqlApi.send(msg);
        }
        let s = null;
    }
    catch (e) {
        console.error(e);
    }
}

export async function addUnitxInQueue(msg:any):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}
