import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {afterAction} from '../queue';
import { packParam } from '../core';
import {User, checkRunner} from './router';

export default function(router:Router) {
    router.post('/action/:name', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let {id, db, unit} = user;
            let {name} = req.params;
            let body = (req as any).body;
            let {data} = body;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            let {call} = schema;
            if (data === undefined) data = packParam(call, body);
            let result = await runner.action(name, unit, id, data);
            let returns = call.returns;
            let {hasSend, busFaces} = schema.run;
            let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, result);
            res.json({
                ok: true,
                res: actionReturn
            });
        }
        catch (err) {
            res.json({
                error: err
            });
        };
    });
}
