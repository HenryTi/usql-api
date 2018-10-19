import {Router, Request, Response, NextFunction} from 'express';
import {queueSheet, queueToUnitx, SheetMessage} from '../queue';
import {User, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';

export default function(router:Router) {
    router.post('/sheet/:name', async (req:Request, res:Response) => {
        try {
            let userToken:User = (req as any).user;
            let {db, id:userId, unit} = userToken;
            let {name} = req.params;
            let body = (req as any).body;
            let {app, discription, data} = body;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let result = await runner.sheetSave(name, unit, userId, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                let sheetMsg:SheetMessage = {
                    unit: unit,
                    type: 'sheet',
                    from: userId,
                    db: db,
                    body: sheetRet,
                    to: [userId],
                };
                await queueToUnitx(sheetMsg);
                /*
                    await queueSheetToUnitx(_.merge({
                    $unit: unit,
                    $db: db,
                }, sheetRet));*/
            }
            res.json({
                ok: true,
                res: sheetRet
            });
        }
        catch (err) {
            res.json({error: err});
        }
    });

    router.put('/sheet/:name', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let {db, id: userId} = user;
        let {name} = req.params;
        let body = (req as any).body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        await runner.sheetProcessing(body.id);
        let {state, action, id, flow} = body;
        await queueSheet({
            db: db,
            from: userId,
            sheetHead: {
                sheet: name,
                state: state,
                action: action,
                unit: user.unit,
                user: user.id,
                id: id,
                flow: flow,
            }
        });
        await res.json({
            ok: true,
            res: {msg: 'add to queue'}
        })
    });

    router.post('/sheet/:name/states', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name} = req.params;
        let body = (req as any).body;
        let {state, pageStart, pageSize} = body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        runner.sheetStates(name, state, user.unit, user.id, pageStart, pageSize).then(result => {
            res.json({
                ok: true,
                res: result
            });
        }).catch(err => {
            res.json({error: err});
        })
    });

    router.get('/sheet/:name/statecount', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name} = req.params;
        let body = (req as any).body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        runner.sheetStateCount(name, user.unit, user.id).then(result => {
            res.json({
                ok: true,
                res: result
            });
        }).catch(err => {
            res.json({error: err});
        })
    });

    router.get('/sheet/:name/get/:id', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name, id} = req.params;
        let body = (req as any).body;
        let {state, pageStart, pageSize} = body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        runner.getSheet(name, user.unit, user.id, id as any).then(result => {
            res.json({
                ok: true,
                res: result
            });
        }).catch(err => {
            res.json({error: err});
        })
    });

    router.post('/sheet/:name/archives', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name} = req.params;
            let body = (req as any).body;
            let {pageStart, pageSize} = body;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let result = await runner.sheetArchives(name, user.unit, user.id, pageStart, pageSize);
            res.json({
                ok: true,
                res: result
            });
        }
        catch(err) {
            res.json({error: err});
        }
    });

    router.get('/sheet/:name/archive/:id', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name, id} = req.params;
            let body = (req as any).body;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let result = await runner.sheetArchive(user.unit, user.id, name, id as any);
            res.json({
                ok: true,
                res: result
            });
        }
        catch(err) {
            res.json({error: err});
        }
    });
}
