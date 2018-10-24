/*
import * as bull from 'bull';
import { pushToCenter } from '../core';

const unitxQueueName = 'unitx-in-queue';
let unitxQueue:bull.Queue;

export async function queueUnitx(msg:any):Promise<bull.Job> {
    return await unitxQueue.add(msg);
}

export function startUnitxQueue(redis:any) {
    unitxQueue = bull(unitxQueueName, redis);
    unitxQueue.on("error", (error: Error) => {
        console.log(unitxQueueName, error);
    });
    unitxQueue.process(async function(job, done) {
        try {
            let {data} = job;
            console.log('pushToCenter start');
            await pushToCenter(data);
            console.log('pushToCenter:', data);
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
}
*/
//# sourceMappingURL=unitxQueue.js.map