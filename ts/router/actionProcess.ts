import { afterAction } from '../queue';
import { Runner } from '../db';
import { packParam } from '../core';

export async function actionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    let {data} = body;
    if (data === undefined) {
        console.log('action process data: ', body);
        data = packParam(schema, body);
    }
    console.log('action process param: ', data);
    let result = await runner.action(name, unit, user, data);
    let returns = schema.returns;
    let {hasSend,  busFaces, templets} = run;
    let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, templets, result);
    return actionReturn;
};
