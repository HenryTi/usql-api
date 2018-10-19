import * as bull from 'bull';
import { BusMessage, ClientMessage, Message } from './model';
import { pushToClient } from './pushToClient';

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
                case 'sheet':
                case 'msg': await pushToClient(data as ClientMessage); break;
                case 'bus': await processBusMessage(data as BusMessage); break;
            }
            /*
            console.log('pushToCenter start');
            await pushToCenter(data);
            console.log('pushToCenter:', data);
            */
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
    console.log('QUEUE: ' + unitxInQueueName);
}

async function processBusMessage(msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的usq服务器
    throw 'bus message in UnitxIn not implement';
}
