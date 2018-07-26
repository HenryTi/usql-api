import * as bull from 'bull';
import * as config from 'config';
import { getRunner } from '../tv/runner';
import { sendMessagesAfterAction } from '../tv/afterAction';
import { packReturn } from '../core';
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
                case 'sheet':
                    await saveSheetMessage($unit, data);
                    break;
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
const newMessage = 'newMessage';
async function saveSheetMessage(unit:number, sheetMessage:any): Promise<void> {
    let {data} = sheetMessage;
    let runner = await getRunner($unitDb);
    //let ret = await runner.action('newMessage', unit, 1, JSON.stringify(data));
    let toUser = 1;
    let schema = runner.getSchema(newMessage);
    let msg = packParam(schema.call, data);
    let result = await runner.action(newMessage, unit, toUser, msg);
    let returns = schema.call.returns;
    let {hasSend, busFaces} = schema.run;
    let actionReturn = await sendMessagesAfterAction($unitDb, runner, unit, returns, hasSend, busFaces, result);
    console.log('save sheet message ', data);
    return;
}

export async function addUnitxInQueue(msg:any):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}
