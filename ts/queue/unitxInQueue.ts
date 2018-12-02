import * as bull from 'bull';
import { BusMessage, ClientMessage, Message, SheetMessage } from './model';
import { pushToClient } from './pushToClient';
import { processSheetMessage } from './processSheetMessage';
import { processBusMessage } from './processBusMessage';

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
            switch (data.type) {
                case 'sheet': await processSheetMessage(data as SheetMessage); break;
                case 'msg': await pushToClient(data as ClientMessage); break;
                case 'bus': await processBusMessage(data as BusMessage); break;
            }
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
    console.log('QUEUE: ' + unitxInQueueName);
}
