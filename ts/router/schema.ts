import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
//import {User, router, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';
import { Runner } from '../db';
import { get } from './process';

export default function(router:Router) {
    //router.get('/schema/:name', async (req:Request, res:Response) => {
    get(router, '/schema/:name',
    async (unit:number, user:number, urlParams:any, runner:Runner, body:any) => {
        let {name} = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    });
    /*
    router.post('/schema', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {body} = req;
        let runner = await checkRunner(db, res);
        //let schema = runner.getSchema(name);
        //if (schema === undefined) return unknownEntity(res, name);
        //let call = schema.call;
        res.json({
            ok: true,
            res: (body as string[]).map(name => (runner.getSchema(name)||{}).call),
        });
    });
    */
    //router.get('/schema/:name/:version', async (req:Request, res:Response) => {
    get(router, '/schema/:name/:version',
    async (unit:number, user:number, urlParams:any, runner:Runner, body:any) => {
        let {name, version} = urlParams;
        let schemaVersion = await runner.loadSchemaVersion(name, version);
        return schemaVersion;
    });
}
