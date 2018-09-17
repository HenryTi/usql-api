import * as bull from 'bull';
import * as config from 'config';
import { getRunner } from '../tv/runner';
import { afterAction } from '../tv/afterAction';
import { packReturn, pushToCenter } from '../core';
import { packParam } from '../core/packParam';

const unitxQueueName = 'unitx-in-queue';
let unitxInQueue:bull.Queue;

export function startUnitxInQueue(redis:any) {
    console.log('start queue: ', unitxQueueName);
    unitxInQueue = bull(unitxQueueName, redis);
    unitxInQueue.isReady().then(q => {
        console.log("queue: %s, redis: %s", unitxQueueName, JSON.stringify(redis));
    });

    unitxInQueue.process(async function(job, done) {
        try {
            let {data} = job;
            console.log('accept message: ', data);
            if (data !== undefined) {
                let {$job, $unit} = data;
                switch ($job) {
                    case 'sheetMsg':
                        await processSheetMessage($unit, data);
                        break;
                    //case 'sheetMsgDone':
                    //    await removeSheetMessage($unit, data);
                    //    break;
                }
            }
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
}

const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlSheetDoneMessage = 'sheetDoneMessage';
const usqlGetSheetTo = 'getSheetTo';
async function processSheetMessage(unit:number, sheetMessage:any): Promise<void> {
    let runner = await getRunner($unitx);
    let {no, discription, /*to, */usq, id:sheet, state, user, name} = sheetMessage;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo:any[] = [usq, sheetName, stateName];
    let sheetTo:any[] = await runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
    let toUsers:{toUser:number}[] = sheetTo.map(v => {
        return {toUser: v.to}
    });
    if (toUsers.length === 0) toUsers = [
        {toUser: user}
    ];
    //let toUsers = await getToUsers(user); 
    let data = {
        //type: 'sheetMsg',
        subject: discription,
        discription: no + ' - ' + stateName,
        content: JSON.stringify(sheetMessage),
        //meName: 'henry',
        //meNick: 'henry-nick',
        //meIcon: undefined,
        usq: usq,
        sheet: sheet,
        state: state,
        to: toUsers,
    };
    let toUser = 1;
    let schema = runner.getSchema(usqlSheetMessage);
    let msg = packParam(schema.call, data);
    let result = await runner.action(usqlSheetMessage, unit, toUser, msg);
    let returns = schema.call.returns;
    let {hasSend, busFaces} = schema.run;
    let actionReturn = await afterAction($unitx, runner, unit, returns, hasSend, busFaces, result);
    console.log('save sheet message ', data);
    return;
}

async function getToUsers(toUser:number):Promise<{toUser:number}[]> {
    // 调用组织结构来计算
    let ret:{toUser:number}[] = [];
    //let toArr:any[] = JSON.parse(toText);
    /*
    if (!toArr) {
        return [{toUser: toUser}];
    }
    for (let to of toArr) {
        switch (typeof to) {
            case 'number': ret.push({toUser: to}); break;
            case 'string': break;
        }
    }
    */
    return ret;
}

export async function addUnitxInQueue(msg:any):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}
