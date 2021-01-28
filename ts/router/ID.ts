import { Router } from 'express';
import * as _ from 'lodash';
import { EntityRunner, RouterBuilder } from '../core';

export function buildIDRouter(router: Router, rb: RouterBuilder) {
    rb.entityPost(router, 'id', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ID(body);
        return result;
    });

    rb.entityPost(router, 'key-id', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyID(body);
        return result;
    });

    rb.entityPost(router, 'id2', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.ID2(body);
        return result;
    });

    rb.entityPost(router, 'key-id2', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.KeyID2(body);
        return result;
    });

    rb.entityPost(router, 'id-log', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDLog(body);
        return result;
    });

    rb.entityPost(router, 'id-acts', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDActs(body);
        return result;
    });

    rb.entityPost(router, 'id-detail', '',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let result = await runner.IDDetail(unit, user, body);
        return result;
    });
}
