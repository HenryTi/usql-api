import { Router, Request, Response } from 'express';
import * as _ from 'lodash';
import { EntityRunner, RouterBuilder, packArr, User } from '../core';

const IDType = 'id';

export function buildIDRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, IDType, '/id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ID(body);
        return result;
    });

    rb.entityPost(router, IDType, '/key-id', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyID(body);
        return result;
    });

    rb.entityPost(router, IDType, '/id2', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ID2(body);
        return result;
    });

    rb.entityPost(router, IDType, '/key-id2', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyID2(body);
        return result;
    });

    rb.entityPost(router, IDType, '/id-log', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDLog(body);
        return result;
    });

    rb.entityPost(router, IDType, '/id-acts', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDActs(body);
        return result;
    });
}
