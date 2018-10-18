import * as bull from 'bull';
import { UnitxPack, Message, SheetMessage } from './model';
import { sendToUnitx } from './sendToUnitx';
import { getRunner } from '../tv/runner';

const toUnitxQueueName = 'to-unitx-queue';
let toUnitxQueue:bull.Queue<UnitxPack>;

export async function queueToUnitx(msg:UnitxPack):Promise<bull.Job> {
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
            let {unit, message} = data;
            await sendMsgToUnitx(unit, message);
            done();
        }
        catch(err) {
            console.error(err);
            done(new Error(err));
        }
    });
}

async function sendMsgToUnitx(unit:number, msg:Message): Promise<void> {
    let toArr = await sendToUnitx(unit, msg);
    let {type} = msg;
    if (type !== 'sheet') return;

    let sheetMsg: SheetMessage = msg as SheetMessage;
    if (toArr === undefined) return;
    if (toArr.length === 0) return;

    let {id, db} = sheetMsg;
    let runner = await getRunner(db);
    if (runner === undefined) return;
    let user:number = 0; // 操作usq，必须有操作人，系统操作=0
    await runner.sheetTo(unit, user, id, toArr);
    console.log('sheet to unitx', msg);
}
