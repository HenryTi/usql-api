import {Router} from 'express';
import {packReturn} from '../core';
import { entityPost } from './entityProcess';
import { Runner } from '../db';

export default function(router:Router) {
    //router.post('/query/:name', async (req:Request, res:Response) => {
    entityPost(router, 'query', '/:name',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let params:any[] = [];
        let fields = schema.fields;
        let len = fields.length;
        for (let i=0; i<len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = await runner.query(name, unit, user, params);
        let data = packReturn(schema, result);
        return data;
    });

    //router.post('/page/:name', async (req:Request, res:Response) => {
    entityPost(router, 'query', '-page/:name',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            let page = (schema.returns as any[]).find(v => v.name === '$page');
            if (page !== undefined) {
                let startField = page.fields[0];
                if (startField !== undefined) {
                    switch (startField.type) {
                        case 'date':
                        case 'time':
                        case 'datetime': pageStart = new Date(pageStart); break;
                    }
                }
            }
        }
        let params:any[] = [pageStart, body['$pageSize']];
        let fields = schema.fields;
        let len = fields.length;
        for (let i=0; i<len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = await runner.query(name, unit, user, params);
        let data = packReturn(schema, result);
        return data;
    });
}
