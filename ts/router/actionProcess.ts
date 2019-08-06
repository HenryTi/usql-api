//import { afterAction } from '../queue';
import { Runner, packParam } from '../core';

export async function actionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> {
    let result = await actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
    /*
    let {data} = body;
    if (data === undefined) {
        console.log('action process data: ', body);
        data = packParam(schema, body);
    }
    console.log('action process param: ', data);
    let result = await runner.action(name, unit, user, data);
    */
    //let returns = schema.returns;
    //let {hasSend,  busFaces, templets} = run;
    //let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, templets, result);
    //let {busFaces} = run;
    //let actionReturn = await afterAction(db, runner, unit, returns, busFaces, result);
    //return actionReturn;

    let arr0 = result[0];
    if (arr0 === undefined || arr0.length === 0) return;
    return arr0[0];
};

export async function actionReturns(unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any[][]> {
    let {data} = body;
    if (data === undefined) {
        console.log('action process data: ', body);
        data = packParam(schema, body);
    }
    console.log('action process param: ', data);
    let result = await runner.action(name, unit, user, data);
    return result;
}
