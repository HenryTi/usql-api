import {Router, Request, Response, NextFunction} from 'express';
import * as config from 'config';
import * as multer from 'multer'; 
import {UsqlApp} from '../usql';
import * as il from '../usql';
import {getRunner, Runner, resetRunner, createRunner} from '../usql/runner';
import {pack} from '../core/packReturn';
import {queue} from './queue';
import {afterAction} from './afterAction';
import { centerApi } from '../core/centerApi';

interface User {
    db: string;
    id: number;
    unit: number; //unit: number,
    roles: string;
};

const router: Router = Router();

async function checkRunner(db:string, res:Response):Promise<Runner> {
    let runner = await getRunner(db);
    if (runner !== undefined) return runner;
    res.json({
        error: 'Database ' + db + ' 不存在'
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
        let db = user.db;
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
        let result = await runner.tuidSave(name, user.unit, user.id, params);
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

router.post('/tuidids/:name', async (req:Request, res:Response) => {
    let user:User = (req as any).user;
    let db = user.db;
    let {name} = req.params;
    let runner = await checkRunner(db, res);
    if (runner === undefined) return;
    let body = (req as any).body;
    let ids = (body as number[]).join(',');
    runner.tuidIds(name, user.unit, user.id, ids).then(result => {
        res.json({
            ok: true,
            res: result
        });
    });
});

router.post('/tuids/:name', async (req:Request, res:Response) => {
    try {
        let user:User = (req as any).user;
        let db = user.db;
        let {name} = req.params;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let body = (req as any).body;
        let result = await runner.tuidSeach(name, user.unit, user.id, body.key||'', body.pageStart, body.pageSize);
        //let more = false;
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
        let result = await runner.action(name, unit, id, data);
        let schema = runner.getSchema(name);
        let returns = schema.call.returns;
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
        let data = pack(callSchema, result);
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
        let data = pack(callSchema, result);
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
        let data = pack(callSchema, result);
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
        let data = pack(callSchema, result);
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
        let user:User = (req as any).user;
        let db = user.db;
        let {name} = req.params;
        let body = (req as any).body;
        let runner = await checkRunner(db, res);
        if (runner === undefined) return;
        let result = await runner.sheetSave(name, user.unit, user.id, body.discription, body.data);
        res.json({
            ok: true,
            res: result[0]
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
    await queue.add({
        job: 'sheetAct',
        db: db,
        sheet: name,
        state: body.state,
        action: body.action,
        unit: user.unit,
        user: user.id,
        id: body.id,
        flow: body.flow,
    });
    await res.json({
        ok: true,
        res: {msg: 'add to queue'}
    })
    /*
    runner.sheetAct(name, body.state, body.action, user.hao, user.id, body.id).then(result => {
        res.json({
            ok: true,
            res: result[0]
        });
    }).catch(err => {
        res.json({error: err});
    })*/
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

export * from './queue';