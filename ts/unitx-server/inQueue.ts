import * as bull from 'bull';
import * as config from 'config';
import { getRunner } from '../tv/runner';
import { afterAction } from '../tv/afterAction';
import { packReturn, wsSendMessage } from '../core';
import { packParam } from '../core/packParam';

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

const $unitDb = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlSheetDoneMessage = 'sheetDoneMessage';
async function processSheetMessage(unit:number, sheetMessage:any): Promise<void> {
    let runner = await getRunner($unitDb);
    let {no, discription, to, api, id:sheet, state, user} = sheetMessage;
    let toUsers = await getToUsers(to); 
    if (toUsers.length === 0) toUsers.push({toUser: user});
    let data = {
        //type: 'sheetMsg',
        subject: discription,
        discription: no,
        content: JSON.stringify(sheetMessage),
        //meName: 'henry',
        //meNick: 'henry-nick',
        //meIcon: undefined,
        api: api,
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
    let actionReturn = await afterAction($unitDb, runner, unit, returns, hasSend, busFaces, result);
    console.log('save sheet message ', data);
    return;
}

async function getToUsers(toText:string):Promise<{toUser:number}[]> {
    let ret:{toUser:number}[] = [];
    let toArr:any[] = JSON.parse(toText);
    for (let to of toArr) {
        switch (typeof to) {
            case 'number': ret.push({toUser: to}); break;
            case 'string': break;
        }
    }
    return ret;
}

export async function addUnitxInQueue(msg:any):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}
