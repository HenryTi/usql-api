import { Router } from 'express';
import { packReturn } from '../core';
import { entityPost } from './entityProcess';
import { Runner } from '../db';

export default function(router:Router) {
    //router.post('/book/:name', async (req:Request, res:Response) => {
    entityPost(router, 'book', '/:name',
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:Runner, body:any, schema:any) => {
        let pageStart = body['$pageStart'];
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