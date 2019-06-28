import * as bull from 'bull';
import * as _ from 'lodash';
import { getRunner } from '../db/runner';
import { afterAction } from './afterAction';
import { SheetAct, SheetMessage } from './model';
import { queueToUnitx } from './toUnitxQueue';

const sheetQueueName = 'sheet-queue';
let sheetQueue:bull.Queue<SheetAct>;

export async function queueSheet(msg:SheetAct):Promise<bull.Job> {
    return await sheetQueue.add(msg);
}

export function startSheetQueue(redis:any) {
    sheetQueue = bull(sheetQueueName, redis);
    sheetQueue.on("error", (error: Error) => {
        console.log(sheetQueueName, error);
    });
    sheetQueue.process(async function(job, done) {
        let {data} = job;
        await doSheetAct(data);
        done();
    });
    console.log('QUEUE: ' + sheetQueueName);
}

async function doSheetAct(sheetAct:SheetAct):Promise<void> {
    let {db, sheetHead, from} = sheetAct;
    let {id, sheet, state, action, unit, user, flow} = sheetHead;
    let runner = await getRunner(db);
    if (runner === undefined) {
        console.log('sheetAct: ', db + ' is not valid');
        return;
    }
    try {
        let result = await runner.sheetAct(sheet, state, action, unit, user, id, flow);
        let schema = runner.getSchema(sheet);
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
            let sheetMsg:SheetMessage = {
                unit: unit,
                type: 'sheet',
                from: from,
                db: db,
                subject: sheetRet.discription,
                body: sheetRet,
                to: undefined,
            };
            await queueToUnitx(sheetMsg);
        }

        let hasMessage:boolean, busFaces:any[], templets:any[];
        if (Array.isArray(actionRun) === true) {
            hasMessage = false;
            busFaces = actionRun;
        }
        else {
            hasMessage = actionRun.hasSend;
            busFaces = actionRun.busFaces;
            templets = actionRun.templets;
        }
        await afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, templets, result);
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}
