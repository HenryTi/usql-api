import {Router, Request, Response, NextFunction} from 'express';
import * as _ from 'lodash';
import {getRunner, Runner} from './runner';
import {packReturn} from '../core';
import {addSheetQueue} from './sheetQueue';
import {afterAction} from './afterAction';
import {apiErrors} from './apiErrors';
import { addOutQueue } from './outQueue';
import { packParam } from '../core/packReturn';

interface User {
    db: string;
    id: number;
    unit: number;
    roles: string;
};

const router: Router = Router();

async function checkRunner(db:string, res:Response):Promise<Runner> {
    let runner = await getRunner(db);
    if (runner !== undefined) return runner;
    res.json({
        error: {
            no: apiErrors.databaseNotExists,
            message: 'Database ' + db + ' 不存在'
        }
    });
}

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

function unknownEntity(res:Response, name:string) {
    res.json({error: 'unknown entity: ' + name});
}
function validEntity(res:Response, schema:any, type:string):boolean {
    if (schema.type === type) return true;
    res.json({error: schema.name + ' is not ' + type});
    return false;
}
function validTuidArr(res:Response, schema:any, arrName:string):any {
    let {name, type, arr} = schema;
    if (type !== 'tuid') {
        res.json({error: name + ' is not tuid'});
        return;
    }
    let schemaArr = arr[arrName];
    if (schemaArr !== undefined) return schemaArr;
    res.json({error: name + ' does not have arr ' + arrName });
    return;
}

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
                        //let arrParams:any[] = [id, arrValue[arr.id], arrValue[arr.order]];
                        let arrParams:any[] = [id, arrValue[arr.id], arrValue[arr.order]];
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
        let params:any[] = [owner, id, body['$order']];
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

router.post('/query/:name', async (req:Request, res:Response) => {
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
        if (validEntity(res, callSchema, 'query') === false) return;
        let params:any[] = [];
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

router.post('/page/:name', async (req:Request, res:Response) => {
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
        if (validEntity(res, callSchema, 'query') === false) return;
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            let page = (callSchema.returns as any[]).find(v => v.name === '$page');
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

router.post('/history/:name', async (req:Request, res:Response) => {
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
        if (validEntity(res, callSchema, 'history') === false) return;
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            pageStart = new Date(pageStart);
        }
        let params:any[] = [pageStart, body['$pageSize']];
        let fields = callSchema.keys;
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

router.post('/sheet/:name', async (req:Request, res:Response) => {
    try {
        let userToken:User = (req as any).user;
        let {db, id, unit} = userToken;
        let {name} = req.params;
        let body = (req as any).body;
        let {app, discription, data} = body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let result = await runner.sheetSave(name, unit, id, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            await addOutQueue(_.merge({
                $job: 'sheetMsg',
                $unit: unit,
                $db: db,
            }, sheetRet));
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
    let db = user.db;
    let {name} = req.params;
    let body = (req as any).body;
    let runner = await checkRunner(db, res);
    if (runner === undefined) return;
    await runner.sheetProcessing(body.id);
    let {state, action, id, flow} = body;
    await addSheetQueue({
        job: 'sheetAct',
        db: db,
        sheet: name,
        state: state,
        action: action,
        unit: user.unit,
        user: user.id,
        id: id,
        flow: flow,
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

export default router;

export * from './outQueue';
export * from './sheetQueue';
