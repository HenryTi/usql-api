import * as bull from 'bull';
import * as config from 'config';
import { getRunner } from './runner';
import { wsSendMessage } from '../core';
import { sendMessagesAfterAction } from './afterAction';

const sheetQueueName = 'unitx-sheet-queue';
let redis = config.get<any>('redis');

export const unitxSheetQueue = bull(sheetQueueName, redis);
unitxSheetQueue.isReady().then(q => {
    console.log("queue: %s, redis: %s", sheetQueueName, JSON.stringify(redis));
});

unitxSheetQueue.on("error", (error: Error) => {
    console.log('queue server: ', error);
});

unitxSheetQueue.process(async function(job, done) {
    let {data} = job;
    if (data !== undefined) {
        await sheetAct(data);
    } 
    done();
});

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
        let hasMessage, busFaces;
        if (Array.isArray(actionRun) === true) {
            hasMessage = false;
            busFaces = actionRun;
        }
        else {
            hasMessage = actionRun.hasSend;
            busFaces = actionRun.busFaces;
        }
        let actionReturn = await sendMessagesAfterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
        let msg = {
            $type: 'sheetAct',
            $user: user,
            $unit: unit,
        };
        let ar = actionReturn;
        if (ar !== undefined) {
            for (let i in ar) msg[i] = ar[i];
        }
        await wsSendMessage(db, msg);
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}

export async function addUnitxSheetQueue(msg:any):Promise<bull.Job> {
    return await unitxSheetQueue.add(msg);
}
