import { EntityRunner, Db } from "../core";

const resDbName = '$res';

export async function initResDb() {
	let db = Db.db(resDbName);
    let runner = new EntityRunner(resDbName, db);
    await runner.initResDb(resDbName);
}

let resDbRunner: EntityRunner;
export async function getResDbRunner():Promise<EntityRunner> {
    if (resDbRunner === undefined) {
		let db = Db.db(resDbName)
        resDbRunner = new EntityRunner(resDbName, db);
    }
    return resDbRunner;
}
