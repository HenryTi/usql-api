import * as bull from 'bull';
import { pushToCenter } from '../core';

const unitxQueueName = 'unitx-in-queue';
let unitxQueue:bull.Queue;

export async function startUnitxQueue(redis:any):Promise<bull.Queue> {
    unitxQueue = bull(unitxQueueName, redis);
    unitxQueue.on("error", (error: Error) => {
        console.log(unitxQueueName, error);
    });
    unitxQueue.process(async function(job, done) {
        try {
            let {data} = job;
            await pushToCenter(data);
            /*
            console.log('accept message: ', data);
            if (data !== undefined) {
                let {$job, $db, $unit} = data;
                switch ($job) {
                    case 'sheetMsg':
                        await processSheetMessage($unit, $db, data);
                        break;
                    //case 'sheetMsgDone':
                    //    await removeSheetMessage($unit, data);
                    //    break;
                }
            }
            */
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
    await unitxQueue.isReady();
    console.log(unitxQueueName, ' is ready');
    return unitxQueue;
}

export async function queueUnitx(msg:any):Promise<bull.Job> {
    return await unitxQueue.add(msg);
}
