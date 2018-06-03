import {wsSendMessage} from '../ws';
import {getRunner, Runner, resetRunner} from '../usql/runner';
import {afterAction} from './afterAction';
import { isArray } from 'util';

export async function sheetAct(jobData:any):Promise<void> {
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
        let hasSend, busFaces;
        if (isArray(actionRun) === true) {
            hasSend = false;
            busFaces = actionRun;
        }
        else {
            hasSend = actionRun.hasSend;
            busFaces = actionRun.busFaces;
        }
        let actionReturn = await afterAction(db, runner, unit, actionSchema.returns, hasSend, busFaces, result);
        let msg = {
            $type: 'sheetAct',
            $user: user,
            $unit: unit,
        };
        let ar = actionReturn;
        if (ar !== undefined) {
            for (let i in ar) msg[i] = ar[i];
        }
        await wsSendMessage(db, unit, user, msg);
    }
    catch(err) {
        console.log('sheet Act error: ', err);
    };
}
