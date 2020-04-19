import { Db, EntityRunner } from "../core";

const $uq = '$uq';

export async function init$UqDb() {
	let db = new Db($uq);
    let runner = new EntityRunner($uq, db);
    await runner.init$UqDb();
}
