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
const _ = require("lodash");
const runner_1 = require("./runner");
const core_1 = require("../core");
const sheetQueue_1 = require("./sheetQueue");
const afterAction_1 = require("./afterAction");
const apiErrors_1 = require("./apiErrors");
const outQueue_1 = require("./outQueue");
;
const router = express_1.Router();
function checkRunner(db, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner(db);
        if (runner !== undefined)
            return runner;
        res.json({
            error: {
                no: apiErrors_1.apiErrors.databaseNotExists,
                message: 'Database ' + db + ' 不存在'
            }
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
function validTuidArr(res, schema, arrName) {
    let { name, type, arr } = schema;
    if (type !== 'tuid') {
        res.json({ error: name + ' is not tuid' });
        return;
    }
    let schemaArr = arr[arrName];
    if (schemaArr !== undefined)
        return schemaArr;
    res.json({ error: name + ' does not have arr ' + arrName });
    return;
}
router.get('/schema/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name } = req.params;
    let runner = yield checkRunner(db, res);
    let schema = runner.getSchema(name);
    if (schema === undefined)
        return unknownEntity(res, name);
    let call = schema.call;
    res.json({
        ok: true,
        res: call,
    });
}));
router.post('/schema', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { body } = req;
    let runner = yield checkRunner(db, res);
    //let schema = runner.getSchema(name);
    //if (schema === undefined) return unknownEntity(res, name);
    //let call = schema.call;
    res.json({
        ok: true,
        res: body.map(name => (runner.getSchema(name) || {}).call),
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
        let arr0 = result[0];
        let value = undefined;
        if (arr0.length > 0) {
            value = arr0[0];
            let { arrs } = schemaCall;
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    value[arrs[i].name] = result[i + 1];
                }
            }
        }
        res.json({
            ok: true,
            res: value,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.get('/tuid-arr/:name/:owner/:arr/:id/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { id, name, owner, arr } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaArr = validTuidArr(res, schema.call, arr);
        if (schemaArr === undefined)
            return;
        let result = yield runner.tuidArrGet(name, arr, user.unit, user.id, owner, id);
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
router.get('/tuid-arr-all/:name/:owner/:arr/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name, owner, arr } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaArr = validTuidArr(res, schema.call, arr);
        if (schemaArr === undefined)
            return;
        let result = yield runner.tuidGetArrAll(name, arr, user.unit, user.id, owner);
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
        let { id: userId, unit, db } = user;
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
        let result = yield runner.tuidSave(name, unit, userId, params);
        let row = result[0];
        id = row.id;
        if (id > 0) {
            let { arrs } = schemaCall;
            if (arrs !== undefined) {
                for (let arr of arrs) {
                    let arrName = arr.name;
                    let fields = arr.fields;
                    let arrValues = body[arrName];
                    if (arrValues === undefined)
                        continue;
                    for (let arrValue of arrValues) {
                        let arrParams = [id, arrValue[arr.id.name]];
                        let len = fields.length;
                        for (let i = 0; i < len; i++) {
                            arrParams.push(arrValue[fields[i].name]);
                        }
                        yield runner.tuidArrSave(name, arrName, unit, userId, arrParams);
                    }
                }
            }
        }
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
router.post('/tuid-arr/:name/:owner/:arr/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name, owner, arr } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaArr = validTuidArr(res, schema.call, arr);
        if (schemaArr === undefined)
            return;
        let body = req.body;
        let id = body["$id"];
        let params = [owner, id];
        let fields = schemaArr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.tuidArrSave(name, arr, user.unit, user.id, params);
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
router.post('/tuid-arr-pos/:name/:owner/:arr/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name, owner, arr } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaArr = validTuidArr(res, schema.call, arr);
        if (schemaArr === undefined)
            return;
        let body = req.body;
        let { $id, $order } = body;
        let params = [owner, $id, $order];
        //let fields = schemaArr.fields;
        //let len = fields.length;
        //for (let i=0; i<len; i++) {
        //    params.push(body[fields[i].name]);
        //}
        let result = yield runner.tuidArrPos(name, arr, user.unit, user.id, params);
        //let row = result[0];
        res.json({
            ok: true,
        });
    }
    catch (err) {
        res.json({ error: err });
        return;
    }
}));
router.post('/tuidids/:name/:arr', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let user = req.user;
    let db = user.db;
    let { name, arr } = req.params;
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    let body = req.body;
    let ids = body.join(',');
    let result = yield runner.tuidIds(name, arr, user.unit, user.id, ids);
    res.json({
        ok: true,
        res: result
    });
}));
router.post('/tuids/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let { unit, id, db } = user;
        let { name } = req.params;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let { arr, owner, key, pageStart, pageSize } = req.body;
        let result = arr === undefined ?
            yield runner.tuidSeach(name, unit, id, arr, key, pageStart, pageSize)
            :
                yield runner.tuidArrSeach(name, unit, id, arr, owner, key, pageStart, pageSize);
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
router.get('/tuid-bindSlaves/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let { slave, masterId, pageStart, pageSize } = req.query;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let result = yield runner.tuidBindSlaves(name, user.unit, user.id, slave, masterId, pageStart, pageSize);
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
router.post('/tuid-bindSlave/:name/:slave', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name, slave } = req.params;
        let body = req.body;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(slave);
        if (schema === undefined)
            return unknownEntity(res, slave);
        let schemaCall = schema.call;
        if (validEntity(res, schemaCall, 'tuid') === false)
            return;
        let { $master, $first, $id } = body;
        let params = [$master, $first, $id];
        let fields = schemaCall.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.tuidBindSlaveSave(name, slave, user.unit, user.id, params);
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
router.post('/action/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let { id, db, unit } = user;
        let { name } = req.params;
        let body = req.body;
        let { data } = body;
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
router.post('/query/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return unknownEntity(res, name);
        let callSchema = schema.call;
        if (validEntity(res, callSchema, 'query') === false)
            return;
        let params = [];
        let fields = callSchema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            params.push(body[fields[i].name]);
        }
        let result = yield runner.query(name, user.unit, user.id, params);
        let data = core_1.packReturn(callSchema, result);
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
router.post('/page/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let body = req.body;
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
        let data = core_1.packReturn(callSchema, result);
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
        let data = core_1.packReturn(callSchema, result);
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
        let data = core_1.packReturn(callSchema, result);
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
        let userToken = req.user;
        let { db, id, unit } = userToken;
        let { name } = req.params;
        let body = req.body;
        let { app, discription, data } = body;
        let runner = yield checkRunner(db, res);
        if (runner === undefined)
            return;
        let result = yield runner.sheetSave(name, unit, id, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            yield outQueue_1.addOutQueue(_.merge({
                $job: 'sheetMsg',
                $unit: unit,
            }, sheetRet));
        }
        res.json({
            ok: true,
            res: sheetRet
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
    let runner = yield checkRunner(db, res);
    if (runner === undefined)
        return;
    yield runner.sheetProcessing(body.id);
    let { state, action, id, flow } = body;
    yield sheetQueue_1.addSheetQueue({
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
    yield res.json({
        ok: true,
        res: { msg: 'add to queue' }
    });
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
__export(require("./outQueue"));
//# sourceMappingURL=index.js.map