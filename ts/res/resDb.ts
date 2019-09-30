import { Runner, Db } from "../core";

const resDbName = '$res';

export async function initResDb() {
    let db = new Db(resDbName);
    let runner = new Runner(resDbName, db);
    await runner.initResDb(resDbName);
}

let resDbRunner: Runner;
export async function getResDbRunner():Promise<Runner> {
    if (resDbRunner === undefined) {
        let db = new Db(resDbName)
        resDbRunner = new Runner(resDbName, db);
    }
    return resDbRunner;
}
