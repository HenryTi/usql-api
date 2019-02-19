import { getRunner, Runner } from "../db";
import { Db } from "../db/db";

const resDbName = '$res';

export async function initResDb() {
    let db = new Db(resDbName);        
    let runner = new Runner(db);
    await runner.initResDb(resDbName);
}

let resDbRunner: Runner;
export async function getResDbRunner():Promise<Runner> {
    if (resDbRunner === undefined) {
        let db = new Db(resDbName)
        resDbRunner = new Runner(db);
    }
    return resDbRunner;
}
