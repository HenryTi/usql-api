import * as bull from 'bull';
import { processSheetMessage } from './processSheetMessage';

const unitxQueueName = 'unitx-in-queue';
let unitxInQueue:bull.Queue;

export function startUnitxInQueue(redis:any) {
    unitxInQueue = bull(unitxQueueName, redis);
    unitxInQueue.isReady().then(q => {
        console.log(unitxQueueName, ' is ready');
    });
    unitxInQueue.on("error", (error: Error) => {
        console.log(unitxQueueName, error);
    });

    unitxInQueue.process(async function(job, done) {
        try {
            let {data} = job;
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
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
}

export async function addUnitxInQueue(msg:any):Promise<bull.Job> {
    return await unitxInQueue.add(msg);
}
