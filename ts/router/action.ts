import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {afterAction} from '../queue';
import { packParam } from '../core';
import { Runner } from '../db';
import { post } from './processRequest';

const actionType = 'action';

export default function(router:Router) {
    post(router, actionType, '/:name', processAction);
}

export async function processAction(unit:number, user:number, db:string, runner:Runner, params:any, body:any, schema:any):Promise<any> {
    let {name} = params;
    let {data} = body;
    if (data === undefined) data = packParam(schema, body);
    let result = await runner.action(name, unit, user, data);
    let returns = schema.returns;
    let {hasSend, busFaces} = schema.run;
    let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, result);
    return actionReturn;
};
