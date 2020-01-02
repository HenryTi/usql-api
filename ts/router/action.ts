import { Router } from 'express';
import { Runner, consts, RouterBuilder, Net } from '../core';
import { actionProcess, actionReturns, actionConvert } from './actionProcess';
import { unitxActionProcess } from './unitx';

const actionType = 'action';

export function buildActionRouter(router:Router, rb:RouterBuilder) {
    rb.entityPost(router, actionType, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        if (db === consts.$unitx)
            return await unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '/:name/returns',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any[][]> => {
        if (db === consts.$unitx)
            return await unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '-json/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        if (db === consts.$unitx)
            return await unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '-convert/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        return await actionConvert(unit, user, name, db, urlParams, runner, body, schema, run);
    });
}
