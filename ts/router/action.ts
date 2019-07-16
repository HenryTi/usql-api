import { Router } from 'express';
import { Runner, consts, RouterBuilder } from '../core';
//import { entityPost } from './entityProcess';
import { actionProcess } from './actionProcess';
import { unitxActionProcess } from './unitx';
//import { packParam } from '../core/packParam';

const actionType = 'action';

export function buildActionRouter(router:Router, rb:RouterBuilder) {
    rb.entityPost(router, actionType, '/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> => {
        if (db === consts.$unitx)
            return await unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    });
    rb.entityPost(router, actionType, '-json/:name', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any):Promise<any> => {
        if (db === consts.$unitx)
            return await unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    });
}
