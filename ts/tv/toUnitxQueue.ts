import * as bull from 'bull';
import fetch from 'node-fetch';
import { centerApi, UnitxApi, urlSetUnitxHost } from "../core";
import { getRunner } from './runner';

const unitxColl: {[id:number]: string} = {};
const sheetToUnitxQueueName = 'sheet-to-unitx-queue';
const busToUnitxQueueName = 'bus-to-unitx-queue';
let sheetQueue: bull.Queue;
let busQueue: bull.Queue;

export async function queueSheetToUnitx(msg:any):Promise<bull.Job> {
    return await sheetQueue.add(msg);
}

export async function queueBusToUnitx(msg:any):Promise<bull.Job> {
    return await busQueue.add(msg);
}

export async function startSheetToUnitxQueue(redis:any):Promise<bull.Queue> {
    sheetQueue = bull(sheetToUnitxQueueName, redis);
    sheetQueue.on("error", (error: Error) => {
        console.log('queue server: ', error);
    });
    sheetQueue.process(async function(job, done) {
        try {
            let data = job.data;
            if (data !== undefined) {
                let {$unit, $db}  = data;
                await sheetToUnitx($unit, $db, data);
            }
            done();
        }
        catch (e) {
            console.error(e);
            done();
        }
    });
    await sheetQueue.isReady();
    console.log(sheetToUnitxQueueName, ' is ready');
    return sheetQueue;
};

export async function startBusToUnitxQueue(redis:any):Promise<bull.Queue> {
    busQueue = bull(busToUnitxQueueName, redis);
    busQueue.on("error", (error: Error) => {
        console.log('queue server: ', error);
    });
    busQueue.process(async function(job, done) {
        try {
            let data = job.data;
            if (data !== undefined) {
                let {$unit, $db}  = data;
                await busToDest($unit, data);
            }
            done();
        }
        catch (e) {
            console.error(e);
            done();
        }
    });
    await busQueue.isReady();
    console.log(busToUnitxQueueName, ' is ready');
    return busQueue;
}

async function sheetToUnitx(unit:number, db:string, msg:any): Promise<void> {
    let unitxUrl = await getUnitxUrl(unit);
    if (unitxUrl === null) {
        console.log('unit %s not have unitx', unit);
        return;
    }
    let unitx = new UnitxApi(unitxUrl);
    let toArr:number[] = await unitx.sheet(msg);
    let runner = await getRunner(db);
    if (runner !== undefined) {
        let sheetId:number = msg.id;
        let user:number = undefined;
        if (toArr !== undefined && toArr.length > 0) {
            await runner.sheetTo(unit, user, sheetId, toArr);
        }
    }
    console.log('sheet to unitx', msg);
}

async function getUnitxUrl(unit:number):Promise<string> {
    let unitxUrl = unitxColl[unit];
    if (unitxUrl !== undefined) return unitxUrl;
    let unitx = await centerApi.unitx(unit);
    if (unitx === undefined) return unitxColl[unit] = null;
    let {url, urlDebug} = unitx;
    if (urlDebug !== undefined) {
        try {
            urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }
    return unitxColl[unit] = url;
}


export interface UnitxMessage {
    service:string;
    $unit:number;
    busOwner:string;
    bus:string;
    face:string;
    data:any[];
}

async function busToDest(unit:number, msg:UnitxMessage):Promise<void> {
    try {
        let {busOwner, bus, face} = msg;
        let ret = await centerApi.unitxBuses(unit, busOwner, bus, face);
        for (let service of ret) {
            let {url} = service;
            let unitx = new UnitxApi(url);
            await unitx.bus(msg);
            console.log('bus to ', url, msg);
        }
    }
    catch (e) {
        console.error(e);
    }
}

// 试试redis server，报告是否工作
export async function trySheetToUnitxQueue() {
    try {
        let job = await sheetQueue.add({job: undefined});
        try {
            await job.remove();
            console.log('redis server ok!');
        }
        catch (err) {
            console.log('redis server job.remove error: ' + err);
        }
    }
    catch (reason) {
        console.log('redis server error: ', reason);
    };
}
