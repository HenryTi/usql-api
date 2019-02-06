import * as bull from 'bull';
import { Message, SheetMessage } from './model';
import { sendToUnitx } from './sendToUnitx';
import { getRunner } from '../db/runner';

const toUnitxQueueName = 'to-unitx-queue';
let toUnitxQueue:bull.Queue<Message>;

export async function queueToUnitx(msg:Message):Promise<bull.Job> {
    return await toUnitxQueue.add(msg);
}

export function startToUnitxQueue(redis:any) {
    toUnitxQueue = bull(toUnitxQueueName, redis);
    toUnitxQueue.on("error", (error: Error) => {
        console.log(toUnitxQueueName, error);
    });
    toUnitxQueue.process(async function(job, done) {
        try {
            let {data} = job;
            await sendMsgToUnitx(data);
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
    console.log('QUEUE: ' + toUnitxQueueName);
}

async function sendMsgToUnitx(msg:Message): Promise<void> {
    let {unit} = msg;
    let toArr = await sendToUnitx(unit, msg);
    let {type} = msg;
    if (type !== 'sheet') return;

    let sheetMsg: SheetMessage = msg as SheetMessage;
    if (toArr === undefined) return;
    if (toArr.length === 0) return;

    let {db, body} = sheetMsg;
    let runner = await getRunner(db);
    if (runner === undefined) return;
    let {id} = body;
    let user:number = 0; // 操作uq，必须有操作人，系统操作=0
    await runner.sheetTo(unit, user, id, toArr);
    console.log('sheet to unitx', msg);
}
