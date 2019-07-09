/*
import { Db } from '../db/db';
import { getRunner, Runner } from '../db';
import { syncBus } from './syncBus';
import { syncTuids } from './syncTuids';

const dbRun = new Db(undefined);

export async function syncDbs():Promise<void> {
    let dbs = await dbRun.uqDbs();
    for (let row of dbs) {
        let {db} = row;
        if ((db as string).substr(0, 1) === '$') continue;
        console.log('---- sync db: ' + db);
        await syncFroms(db);
    }
    return;
}

async function syncFroms(db:string):Promise<void> {
    let runner = await getRunner(db);
    if (runner === undefined) return;
    await syncTuids(runner);
    await syncBus(runner);
}

*/