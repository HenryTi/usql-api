import { Db, Runner } from "../core";

const $uq = '$uq';

export async function init$UqDb() {
    let db = new Db($uq);
    let runner = new Runner($uq, db);
    await runner.init$UqDb();
}
