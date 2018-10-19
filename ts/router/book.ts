import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {packReturn} from '../core';
import {User, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';

export default function(router:Router) {
    router.post('/book/:name', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name} = req.params;
            let body = (req as any).body;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let callSchema = schema.call;
            if (validEntity(res, callSchema, 'book') === false) return;
            let pageStart = body['$pageStart'];
            let params:any[] = [pageStart, body['$pageSize']];
            let fields = callSchema.fields;
            let len = fields.length;
            for (let i=0; i<len; i++) {
                params.push(body[fields[i].name]);
            }
            let result = await runner.query(name, user.unit, user.id, params);
            let data = packReturn(callSchema, result);
            res.json({
                ok: true,
                res: data,
            });
        }
        catch(err) {
            res.json({error: err});
        };
    });
}