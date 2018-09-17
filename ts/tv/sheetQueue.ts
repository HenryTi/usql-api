import * as bull from 'bull';
import * as _ from 'lodash';
import * as config from 'config';
import { getRunner } from './runner';
import { pushToCenter } from '../core';
import { afterAction } from './afterAction';
import { addOutQueue } from './outQueue';

const sheetQueueName = 'sheet-queue';
let sheetQueue:bull.Queue;

export function startSheetQueue(redis:any) {
    sheetQueue = bull(sheetQueueName, redis);
    sheetQueue.isReady().then(q => {
        console.log(sheetQueueName, ' is ready');
    });
    sheetQueue.on("error", (error: Error) => {
        console.log(sheetQueueName, error);
    });

    sheetQueue.process(async function(job, done) {
        let {data} = job;
        if (data !== undefined) {
            await sheetAct(data);
        } 
        done();
    });
}

async function sheetAct(jobData:any):Promise<void> {
    let {db, sheet, state, action, unit, user, id, flow} = jobData;
    let runner = await getRunner(db);
    if (runner === undefined) {
        console.log('sheetAct: ', db + ' is not valid');
        return;
    }
    try {
        let result = await runner.sheetAct(sheet, state, action, unit, user, id, flow);
        let schema = await runner.getSchema(sheet);
        if (schema === undefined) {
            console.error('job queue sheet action error: schema %s is unknow', sheet);
            return;
        }
        let {call, run} = schema;
        console.log('sheetAct: ', JSON.stringify(result[0]));
        let stateSchema = (call.states as any[]).find(v => v.name===state);
        if (stateSchema === undefined) {
            console.error('job queue sheet action error: schema %s.%s is unknow', sheet, state);
            return;
        }
        let actionSchema = (stateSchema.actions as any[]).find(v => v.name === action);
        if (actionSchema === undefined) {
            console.error('job queue sheet action error: schema %s.%s.%s is unknow', sheet, state, action);
            return;
        }
        run = run.run;
        let stateRun = run[state];
        if (stateRun === undefined) {
            console.error('job queue sheet action error: run %s.%s is unknow', sheet, state);
            return;
        }
        let actionRun = stateRun[action];
        if (actionRun === undefined) {
            console.error('job queue sheet action error: run %s.%s.%s is unknow', sheet, state, action);
            return;
        }

        // sheet action返回的最后一个table，是单据消息，要传递给unitx
        let sheetArr = result.pop();
        let sheetRet = sheetArr[0];
        if (sheetRet !== undefined) {
            await addOutQueue(_.merge({
                $job: 'sheetMsg',
                $unit: unit,
            }, sheetRet));
        }
    
        let hasMessage, busFaces;
        if (Array.isArray(actionRun) === true) {
            hasMessage = false;
            busFaces = actionRun;
        }
        else {
            hasMessage = actionRun.hasSend;
            busFaces = actionRun.busFaces;60
        }
        let actionReturn = await afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
        let msg = _.merge({
            $type: 'sheetAct',
            $user: user,
            $unit: unit,
        }, sheetRet);
        //let ar = actionReturn;
        //if (ar !== undefined) {
        //    for (let i in ar) msg[i] = ar[i];
        //}
        await pushToCenter(db, msg);
        //await sheetDoneMessage(unit, id);
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}
/*
async function sheetDoneMessage(unit:number, sheetId:number) {
    await addOutQueue({
        $job: 'sheetMsgDone',
        $unit: unit,
        sheet: sheetId,
    });
}
*/
export async function addSheetQueue(msg:any):Promise<bull.Job> {
    return await sheetQueue.add(msg);
}
