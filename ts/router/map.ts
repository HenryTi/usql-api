import { Router } from 'express';
import { Runner, RouterBuilder, Net } from '../core';
import { actionProcess } from './actionProcess';
import { pageQueryProcess, queryProcess } from './query';

const actionType = 'map';

export function buildMapRouter(router:Router, rb:RouterBuilder) {
    rb.entityPost(router, actionType, '/:name/add', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        let actionName = name + '$add$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await actionProcess(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    });
    rb.entityPost(router, actionType, '/:name/del', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        let actionName = name + '$del$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return await actionProcess(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    });
    rb.entityPost(router, actionType, '/:name/all',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        let queryName = name + '$all$';
        let querySchema = runner.getSchema(queryName);
        return await pageQueryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    });
    rb.entityPost(router, actionType, '/:name/page', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        let queryName = name + '$page$';
        let querySchema = runner.getSchema(queryName);
        return await pageQueryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    });
    rb.entityPost(router, actionType, '/:name/query',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any, run:any, net:Net):Promise<any> => {
        let queryName = name + '$query$';
        let querySchema = runner.getSchema(queryName);
        return await queryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    });
}
