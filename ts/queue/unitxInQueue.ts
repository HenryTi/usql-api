import * as bull from 'bull';
/*
import { BusMessage, ClientMessage, Message, SheetMessage } from '../core/model';
import { pushToClient } from './pushToClient';
import { processSheetMessage } from './processSheetMessage';
import { processBusMessage } from './processBusMessage';
*/
import { Message } from '../core/model';
import { messageProcesser } from './messageProcesser';

const unitxInQueueName = 'unitx-in-queue';
let unitxInQueue:bull.Queue<Message>;

export async function queueUnitxIn(msg:Message):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}

export function startUnitxInQueue(redis:any) {
    unitxInQueue = bull(unitxInQueueName, redis);
    unitxInQueue.on("error", (error: Error) => {
        console.log(unitxInQueueName, error);
    });
    unitxInQueue.process(async function(job, done) {
        try {
            let {data} = job;
            let mp = messageProcesser(data as Message);
            await mp(data as Message);
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
    console.log('QUEUE: ' + unitxInQueueName);
}
