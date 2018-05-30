"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const runner_1 = require("../usql/runner");
const packReturn_1 = require("../core/packReturn");
const queue_1 = require("./queue");
const afterAction_1 = require("./afterAction");
;
const router = express_1.Router();
function checkRunner(db, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner(db);
        if (runner !== undefined)
            return runner;
        res.json({
            error: 'Database ' + db + ' 不存在'
        });
    });
}
router.get('/access', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let { name } = req.params;
    let { acc } = req.query;
    let db = user.db;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    let accs = undefined;
    if (acc !== undefined) {
        accs = acc.split('|');
        if (accs.length === 1 && accs[0].trim().length === 0)
            accs = undefined;
    }
    let access = yield runner.getAccesses(accs);
    res.json({
        ok: true,
        res: access,
    });
}));
function unknownEntity(res, name) {
    res.json({ error: 'unknown entity: ' + name });
}
function validEntity(res, schema, type) {
    if (schema.type === type)
        return true;
    res.json({ error: schema.name + ' is not ' + type });
    return false;
}
router.get('/schema/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let runner = yield checkRunner(db, res);
    let schema = runner.getSchema(name);
    if (schema === undefined)
        return unknownEntity(res, name);
    res.json({
        ok: true,
        res: schema.call,
    });
}));
router.get('/schema/:name/:version', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name, version } = req.params;
    let runner = yield checkRunner(db, res);
    let schema = yield runner.loadSchemaVersion(name, version);
    res.json({
        ok: true,
        res: schema,
    });
}));
router.get('/tuid/:name/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { id, name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let result = yield runner.tuidGet(name, user.unit, user.id, id);
        let row = result[0];
        res.json({
            ok: true,
            res: row,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.get('/tuid-all/:name/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let result = yield runner.tuidGetAll(name, user.unit, user.id);
        res.json({
            ok: true,
            res: result,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.get('/tuid-proxy/:name/:type/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { id, type, name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let result = yield runner.tuidProxyGet(name, user.unit, user.id, id, type);
        let row = result[0];
        res.json({
            ok: true,
            res: row,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.post('/tuid/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let body = req.body;
        let id = body["$id"];
        let params = [id];
        let fields = schemaCall.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.tuidSave(name, user.unit, user.id, params);
        let row = result[0];
        res.json({
            ok: true,
            res: row,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.post('/tuidids/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    let body = req.body;
    let ids = body.join(',');
    runner.tuidIds(name, user.unit, user.id, ids).then(result => {
        res.json({
            ok: true,
            res: result
        });
    });
}));
router.post('/tuids/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let body = req.body;
        let values = [user.unit, user.id, body.key, body.pageStart, body.pageSize];
        let result = yield runner.tuidSeach(name, user.unit, user.id, body.key || '', body.pageStart, body.pageSize);
        //let more = false;
        let rows = result[0];
        res.json({
            ok: true,
            res: rows,
        });
    }
    catch (err) {
        res.json({ error: err });
    }
    ;
}));
router.post('/action/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let { id, db, unit } = user;
        let { name } = req.params;
        let body = req.body;
        let { data } = body;
        let values = [unit, id, data];
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let result = yield runner.action(name, unit, id, data);
        let schema = runner.getSchema(name);
        let returns = schema.call.returns;
        let { hasSend, busFaces } = schema.run;
        let actionReturn = yield afterAction_1.afterAction(db, runner, unit, returns, hasSend, busFaces, result);
        res.json({
            ok: true,
            res: actionReturn
        });
    }
    catch (err) {
        res.json({
            error: err
        });
    }
    ;
}));
router.post('/page/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let values = [user.unit, user.id, body.data];
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let callSchema = schema.call;
        if (validEntity(res, callSchema, 'query') === false)
            return;
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            let page = callSchema.returns.find(v => v.name === '$page');
            if (page !== undefined) {
                let startField = page.fields[0];
                if (startField !== undefined) {
                    switch (startField.type) {
                        case 'date':
                        case 'time':
                        case 'datetime':
                            pageStart = new Date(pageStart);
                            break;
                    }
                }
            }
        }
        let params = [pageStart, body['$pageSize']];
        let fields = callSchema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.query(name, user.unit, user.id, params);
        let data = packReturn_1.pack(callSchema, result);
        res.json({
            ok: true,
            res: data,
        });
    }
    catch (err) {
        res.json({ error: err });
    }
    ;
}));
router.post('/history/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let values = [user.unit, user.id, body.data];
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let callSchema = schema.call;
        if (validEntity(res, callSchema, 'history') === false)
            return;
        let pageStart = body['$pageStart'];
        if (pageStart !== undefined) {
            pageStart = new Date(pageStart);
        }
        let params = [pageStart, body['$pageSize']];
        let fields = callSchema.keys;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.query(name, user.unit, user.id, params);
        let data = packReturn_1.pack(callSchema, result);
        res.json({
            ok: true,
            res: data,
        });
    }
    catch (err) {
        res.json({ error: err });
    }
    ;
}));
router.post('/book/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let values = [user.unit, user.id, body.data];
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let callSchema = schema.call;
        if (validEntity(res, callSchema, 'book') === false)
            return;
        let pageStart = body['$pageStart'];
        let params = [pageStart, body['$pageSize']];
        let fields = callSchema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.query(name, user.unit, user.id, params);
        let data = packReturn_1.pack(callSchema, result);
        res.json({
            ok: true,
            res: data,
        });
    }
    catch (err) {
        res.json({ error: err });
    }
    ;
}));
router.post('/sheet/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let values = [user.unit, user.id, body.data];
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let result = yield runner.sheetSave(name, user.unit, user.id, body.discription, body.data);
        res.json({
            ok: true,
            res: result[0]
        });
    }
    catch (err) {
        res.json({ error: err });
    }
}));
router.put('/sheet/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let body = req.body;
    let values = [user.unit, user.id, body.data];
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    yield runner.sheetProcessing(body.id);
    yield queue_1.queue.add({
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
    yield res.json({
        ok: true,
        res: { msg: 'add to queue' }
    });
    /*
    runner.sheetAct(name, body.state, body.action, user.hao, user.id, body.id).then(result => {
        res.json({
            ok: true,
            res: result[0]
        });
    }).catch(err => {
        res.json({error: err});
    })*/
}));
router.post('/sheet/:name/states', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let body = req.body;
    let { state, pageStart, pageSize } = body;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    runner.sheetStates(name, state, user.unit, user.id, pageStart, pageSize).then(result => {
        res.json({
            ok: true,
            res: result
        });
    }).catch(err => {
        res.json({ error: err });
    });
}));
router.get('/sheet/:name/statecount', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let body = req.body;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    runner.sheetStateCount(name, user.unit, user.id).then(result => {
        res.json({
            ok: true,
            res: result
        });
    }).catch(err => {
        res.json({ error: err });
    });
}));
router.get('/sheet/:name/get/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name, id } = req.params;
    let body = req.body;
    let { state, pageStart, pageSize } = body;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    runner.getSheet(name, user.unit, user.id, id).then(result => {
        res.json({
            ok: true,
            res: result
        });
    }).catch(err => {
        res.json({ error: err });
    });
}));
router.post('/sheet/:name/archives', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let { pageStart, pageSize } = body;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let result = yield runner.sheetArchives(name, user.unit, user.id, pageStart, pageSize);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({ error: err });
    }
}));
router.get('/sheet/:name/archive/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name, id } = req.params;
        let body = req.body;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let result = yield runner.sheetArchive(user.unit, user.id, name, id);
        res.json({
            ok: true,
            res: result
        });
    }
    catch (err) {
        res.json({ error: err });
    }
}));
exports.default = router;
__export(require("./queue"));
//# sourceMappingURL=index.js.map