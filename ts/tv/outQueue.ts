import * as bull from 'bull';
import * as config from 'config';
import fetch from 'node-fetch';
import { centerApi, UnitxApi } from "../core";
import { urlSetCenterHost } from '../core/centerApi';
import { getRunner } from './runner';

const unitxColl: {[id:number]: string} = {};
const outQueueName = 'out-queue';
const $unitx = '$unitx';
let outQueue: bull.Queue;

export function startOutQueue(redis:any) {
    outQueue = bull(outQueueName, redis);
    outQueue.isReady().then(q => {
        console.log(outQueueName, ' is ready');
    });
    outQueue.on("error", (error: Error) => {
        console.log('queue server: ', error);
    });

    outQueue.process(async function(job, done) {
        try {
            let data = job.data;
            if (data !== undefined) {
                let {$job, $unit}  = data;
                switch ($job) {
                    case 'sheetMsg':
                        await sheetToUnitx($unit, data);
                        break;
                    case 'bus':
                        await busToDest($unit, data);
                        break;
                }
            }
            done();
        }
        catch (e) {
            console.error(e);
            done();
        }
    });
}

async function sheetToUnitx(unit:number, msg:any): Promise<void> {
    let unitxUrl = await getUnitxUrl(unit);
    if (unitxUrl === null) {
        console.log('unit %s not have unitx', unit);
        return;
    }
    let unitx = new UnitxApi(unitxUrl);
    let tos:{toUser:number}[] = await unitx.send(msg);
    let runner = await getRunner($unitx);
    let sheetId:number = 0;
    if (tos !== undefined && tos.length > 0) {
        let toArr:number[] = tos.map(v => v.toUser);
        await runner.sheetTo(unit, sheetId, toArr);
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
            urlDebug = urlSetCenterHost(urlDebug);
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
            await unitx.send(msg);
            console.log('bus to ', url, msg);
        }
    }
    catch (e) {
        console.error(e);
    }
}

export async function addOutQueue(msg:any):Promise<bull.Job> {
    return await outQueue.add(msg);
}

// 试试redis server，报告是否工作
export async function tryoutQueue() {
    try {
        let job = await outQueue.add({job: undefined});
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
