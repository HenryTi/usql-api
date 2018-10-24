/*
import * as bull from 'bull';
import * as _ from 'lodash';
import { getRunner } from './runner';
import { afterAction } from './afterAction';
import { queueSheetToUnitx } from './toUnitxQueue';
import { SheetAct } from '../queue';

const sheetActQueueName = 'sheet-act-queue';
let sheetActQueue:bull.Queue<SheetAct>;

export async function queueSheetAct(msg:SheetAct):Promise<bull.Job> {
    return await sheetActQueue.add(msg);
}

export function startSheetActQueue(redis:any) {
    sheetActQueue = bull(sheetActQueueName, redis);
    sheetActQueue.on("error", (error: Error) => {
        console.log(sheetActQueueName, error);
    });
    sheetActQueue.process(async function(job, done) {
        let {data} = job;
        if (data !== undefined) {
            await doSheetAct(data);
        } 
        done();
    });
}

async function doSheetAct(sheetAct:SheetAct):Promise<void> {
    let {db, sheetHead} = sheetAct;
    let {sheet, state, action, unit, user, id, flow} = sheetHead;

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
            await queueSheetToUnitx(_.merge({
                $unit: unit,
                $db: db,
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
        await afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}
*/
