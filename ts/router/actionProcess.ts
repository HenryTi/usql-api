import { afterAction } from '../queue';
import { Runner } from '../db';
import { packParam } from '../core/packParam';

export async function actionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    let {data} = body;
    //if (data === undefined) data = packParam(schema, body);
    if (data === undefined) {
        data = packParam(schema, body);
    }
    let result = await runner.action(name, unit, user, data);
    let returns = schema.returns;
    let {hasSend, busFaces} = run;
    let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, result);
    return actionReturn;
};
