import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {User, checkRunner, unknownEntity, validEntity, validTuidArr} from './router';

export default function(router: Router) {
    router.get('/tuid/:name/:id', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {id, name} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaCall = schema.call;
            if (validEntity(res, schemaCall, 'tuid') === false) return;
            let result = await runner.tuidGet(name, user.unit, user.id, id);
            let arr0 = result[0];
            let value = undefined;
            if (arr0.length > 0) {
                value = arr0[0]; 
                let {arrs} = schemaCall;
                if (arrs !== undefined) {
                    let len = arrs.length;
                    for (let i=0;i<len;i++) {
                        value[arrs[i].name] = result[i+1];
                    }
                }
            }
            res.json({
                ok: true,
                res: value,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });


    router.get('/tuid-arr/:name/:owner/:arr/:id/', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {id, name, owner, arr} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaArr = validTuidArr(res, schema.call, arr);
            if (schemaArr === undefined) return;
            let result = await runner.tuidArrGet(name, arr, user.unit, user.id, owner, id);
            let row = result[0];
            res.json({
                ok: true,
                res: row,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.get('/tuid-all/:name/', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaCall = schema.call;
            if (validEntity(res, schemaCall, 'tuid') === false) return;
            let result = await runner.tuidGetAll(name, user.unit, user.id);
            res.json({
                ok: true,
                res: result,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.get('/tuid-arr-all/:name/:owner/:arr/', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name, owner, arr} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaArr = validTuidArr(res, schema.call, arr);
            if (schemaArr === undefined) return;
            let result = await runner.tuidGetArrAll(name, arr, user.unit, user.id, owner);
            res.json({
                ok: true,
                res: result,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.get('/tuid-proxy/:name/:type/:id', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {id, type, name} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaCall = schema.call;
            if (validEntity(res, schemaCall, 'tuid') === false) return;
            let result = await runner.tuidProxyGet(name, user.unit, user.id, id, type);
            let row = result[0];
            res.json({
                ok: true,
                res: row,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.post('/tuid/:name', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let {id:userId, unit, db} = user;
            let {name} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaCall = schema.call;
            if (validEntity(res, schemaCall, 'tuid') === false) return;
            let body = (req as any).body;
            let id = body["$id"];
            let params:any[] = [id];
            let fields = schemaCall.fields;
            let len = fields.length;
            for (let i=0; i<len; i++) {
                params.push(body[fields[i].name]);
            }
            let result = await runner.tuidSave(name, unit, userId, params);
            let row = result[0];
            if (!id) id = row.id;
            if (id < 0) id = -id;
            if (id>0) {
                let {arrs} = schemaCall;
                if (arrs !== undefined) {
                    for (let arr of arrs) {
                        let arrName = arr.name;
                        let fields = arr.fields;
                        let arrValues = body[arrName];
                        if (arrValues === undefined) continue;
                        for (let arrValue of arrValues) {
                            let arrParams:any[] = [id, arrValue[arr.id]];
                            let len = fields.length;
                            for (let i=0;i<len;i++) {
                                arrParams.push(arrValue[fields[i].name]);
                            }
                            await runner.tuidArrSave(name, arrName, unit, userId, arrParams);
                        }
                    }
                }
            }
            res.json({
                ok: true,
                res: row,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.post('/tuid-arr/:name/:owner/:arr/', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name, owner, arr} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaArr = validTuidArr(res, schema.call, arr);
            if (schemaArr === undefined) return;
            let body = (req as any).body;
            let id = body["$id"];
            let params:any[] = [owner, id];
            let fields = schemaArr.fields;
            let len = fields.length;
            for (let i=0; i<len; i++) {
                params.push(body[fields[i].name]);
            }
            let result = await runner.tuidArrSave(name, arr, user.unit, user.id, params);
            let row = result[0];
            res.json({
                ok: true,
                res: row,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });
    router.post('/tuid-arr-pos/:name/:owner/:arr/', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let db = user.db;
            let {name, owner, arr} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let schema = runner.getSchema(name);
            if (schema === undefined) return unknownEntity(res, name);
            let schemaArr = validTuidArr(res, schema.call, arr);
            if (schemaArr === undefined) return;
            let body = (req as any).body;
            let {$id, $order} = body;
            let params:any[] = [owner, $id, $order];
            //let fields = schemaArr.fields;
            //let len = fields.length;
            //for (let i=0; i<len; i++) {
            //    params.push(body[fields[i].name]);
            //}
            let result = await runner.tuidArrPos(name, arr, user.unit, user.id, params);
            //let row = result[0];
            res.json({
                ok: true,
                //res: row,
            });
        }
        catch(err) {
            res.json({error: err});
            return;
        }
    });

    router.post('/tuidids/:name/:arr', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {name, arr} = req.params;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let body = (req as any).body;
        let ids = (body as number[]).join(',');
        let result = await runner.tuidIds(name, arr, user.unit, user.id, ids);
        res.json({
            ok: true,
            res: result
        });
    });

    router.post('/tuids/:name', async (req:Request, res:Response) => {
        try {
            let user:User = (req as any).user;
            let {unit, id, db} = user;
            let {name} = req.params;
            let runner = await checkRunner(db, res);
            if (runner === undefined) return;
            let {arr, owner, key, pageStart, pageSize} = (req as any).body;
            let result = arr === undefined?
                await runner.tuidSeach(name, unit, id, arr, key, pageStart, pageSize)
                :
                await runner.tuidArrSeach(name, unit, id, arr, owner, key, pageStart, pageSize);

            let rows = result[0];
            res.json({
                ok: true,
                res: rows,
            });
        }
        catch(err) {
            res.json({error: err});
        };
    });
};