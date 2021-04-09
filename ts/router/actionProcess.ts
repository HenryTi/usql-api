import * as _ from 'lodash';
import { EntityRunner, packParam } from '../core';
import { buildExpVar, buildExpCalc, buildLicense } from '../convert';

export async function actionProcess(unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any, run:any):Promise<any> {
    let result = await actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
    let arr0 = result[0];
    if (arr0 === undefined || arr0.length === 0) return;
    return arr0[0];
};

export async function actionReturns(unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any, run:any):Promise<any[][]> {
    let {data} = body;
    if (typeof data === 'object') {
        console.log('action process data: ', body);
        data = packParam(schema, data);
    }
    console.log('action process param: ', data);
    let result = await runner.action(name, unit, user, data);
    return result;
}

export async function actionConvert(unit:number, user:number, entityName:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any, run:any):Promise<any> {
    let data = _.clone(body.data);
    let {paramConvert, returns} = schema;
    let actionConvertSchema:any;
    if (paramConvert !== undefined) {
        let {name, to, type} = paramConvert;
        let v = data[name];
        switch (type) {
            case 'expression': expressionConvert(data, v, to); break;
        }

        actionConvertSchema = runner.getActionConvertSchema(entityName);
        if (actionConvertSchema === undefined) {
            actionConvertSchema = _.cloneDeep(schema);
            let fields:any[] = actionConvertSchema.fields;
            let index = fields.findIndex(v => v.name === name);
            if (index >= 0) {
                fields.splice(index, 1);
                for (let t of to) {
                    fields.push({name: t, type: 'text'});
                }
            }
            runner.setActionConvertSchema(entityName, actionConvertSchema);
        }
    }
    //let param = packParam(actionConvertSchema || schema, data);
    let results = await actionReturns(unit, user, entityName, db, urlParams, runner, 
        {data}, actionConvertSchema || schema, run);
    if (returns == undefined) return;
    let len = returns.length;
    let ret:any[][] = [];
    for (let i=0; i<len; i++) {
        let result = results[i];
        let returnSchema = returns[i];
        let {convert} = returnSchema;
        if (convert === 'license') {
            ret.push(buildLicense(result));
        }
        else {
            ret.push(result);
        }
    }
    return ret;
};

function expressionConvert(data:any, exp:string, to:string[]) {
    data[to[0]] = buildExpVar(exp);
    data[to[1]] = buildExpCalc(exp);
}
