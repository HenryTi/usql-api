"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./router");
function default_1(router) {
    router.get('/tuid/:name/:id', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = req.user;
            let db = user.db;
            let { id, name } = req.params;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaCall = schema.call;
            if (router_1.validEntity(res, schemaCall, 'tuid') === false)
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaArr = router_1.validTuidArr(res, schema.call, arr);
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaCall = schema.call;
            if (router_1.validEntity(res, schemaCall, 'tuid') === false)
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaArr = router_1.validTuidArr(res, schema.call, arr);
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaCall = schema.call;
            if (router_1.validEntity(res, schemaCall, 'tuid') === false)
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaCall = schema.call;
            if (router_1.validEntity(res, schemaCall, 'tuid') === false)
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
            if (!id)
                id = row.id;
            if (id < 0)
                id = -id;
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
                            let arrParams = [id, arrValue[arr.id]];
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaArr = router_1.validTuidArr(res, schema.call, arr);
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
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let schemaArr = router_1.validTuidArr(res, schema.call, arr);
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
        let runner = yield router_1.checkRunner(db, res);
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
            let runner = yield router_1.checkRunner(db, res);
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
}
exports.default = default_1;
;
//# sourceMappingURL=tuid.js.map