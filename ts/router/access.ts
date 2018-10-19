import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {User, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';

export default function(router:Router) {
    router.get('/access', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let {name} = req.params;
        let {acc} = (req as any).query;
        let db = user.db;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let accs:string[] = undefined;
        if (acc !== undefined) {
            accs = acc.split('|');
            if (accs.length === 1 && accs[0].trim().length === 0) accs = undefined;
        }
        let access = await runner.getAccesses(accs);
        res.json({
            ok: true,
            res: access,
        });
    });
}