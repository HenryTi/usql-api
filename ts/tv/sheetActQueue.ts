import * as bull from 'bull';
import * as _ from 'lodash';
import { getRunner } from './runner';
import { afterAction } from './afterAction';
import { queueSheetToUnitx } from './toUnitxQueue';

const sheetActQueueName = 'sheet-act-queue';
let sheetActQueue:bull.Queue;

export async function queueSheetAct(msg:any):Promise<bull.Job> {
    return await sheetActQueue.add(msg);
}

export async function startSheetActQueue(redis:any):Promise<bull.Queue> {
    sheetActQueue = bull(sheetActQueueName, redis);
    sheetActQueue.on("error", (error: Error) => {
        console.log(sheetActQueueName, error);
    });
    sheetActQueue.process(async function(job, done) {
        let {data} = job;
        if (data !== undefined) {
            await sheetQueueAct(data);
        } 
        done();
    });
    await sheetActQueue.isReady();
    console.log(sheetActQueueName, ' is ready');
    return sheetActQueue;
}

async function sheetQueueAct(jobData:any):Promise<void> {
    let {db, sheet, state, action, unit, user, id, flow} = jobData;
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
        let actionReturn = await afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
        /*
        sheetAct消息不是在这里推送，而是在unitx里面推送。unitx知道推送给什么人
        let msg = _.merge({
            $type: 'sheetAct',
            $user: user,
            $unit: unit,
        }, sheetRet);
        await pushToCenter(db, msg);
        */
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}
