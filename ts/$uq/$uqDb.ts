import { Db, Runner } from "../core";

export async function init$UqDb() {
    let db = new Db('$uq');
    let runner = new Runner(db);
    await runner.init$UqDb();
}
