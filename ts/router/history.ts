import { Router } from 'express';
import { packReturn } from '../core';
import { Runner } from '../db';
import { entityPost } from './entityProcess';

export default function(router:Router) {
    //router.post('/history/:name', async (req:Request, res:Response) => {
    entityPost(router, 'history', '/:name',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            pageStart = new Date(pageStart);
        }
        let params:any[] = [pageStart, body['$pageSize']];
        let fields = schema.keys;
        let len = fields.length;
        for (let i=0; i<len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = await runner.query(name, unit, user, params);
        let data = packReturn(schema, result);
        return data;
    });
}
