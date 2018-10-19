import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {User, router, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';

export default function(router:Router) {
    router.get('/schema/:name', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name} = req.params;
        let runner = await checkRunner(db, res);
        let schema = runner.getSchema(name);
        if (schema === undefined) return unknownEntity(res, name);
        let call = schema.call;
        res.json({
            ok: true,
            res: call,
        });
    });

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

    router.get('/schema/:name/:version', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name, version} = req.params;
        let runner = await checkRunner(db, res);
        let schema = await runner.loadSchemaVersion(name, version);
        res.json({
            ok: true,
            res: schema,
        });
    });
}