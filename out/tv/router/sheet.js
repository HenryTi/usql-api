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
const queue_1 = require("../../queue");
const router_1 = require("./router");
function default_1(router) {
    router.post('/sheet/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let userToken = req.user;
            let { db, id: userId, unit } = userToken;
            let { name } = req.params;
            let body = req.body;
            let { app, discription, data } = body;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let result = yield runner.sheetSave(name, unit, userId, app, discription, data);
            let sheetRet = result[0];
            if (sheetRet !== undefined) {
                let sheetMsg = {
                    unit: unit,
                    type: 'sheet',
                    from: userId,
                    db: db,
                    body: sheetRet,
                    to: [userId],
                };
                yield queue_1.queueToUnitx(sheetMsg);
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
            res.json({ error: err });
        }
    }));
    router.put('/sheet/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
        let user = req.user;
        let { db, id: userId } = user;
        let { name } = req.params;
        let body = req.body;
        let runner = yield router_1.checkRunner(db, res);
        if (runner === undefined)
            return;
        yield runner.sheetProcessing(body.id);
        let { state, action, id, flow } = body;
        yield queue_1.queueSheet({
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
        let runner = yield router_1.checkRunner(db, res);
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
        let runner = yield router_1.checkRunner(db, res);
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
        let runner = yield router_1.checkRunner(db, res);
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
            let runner = yield router_1.checkRunner(db, res);
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
            let runner = yield router_1.checkRunner(db, res);
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
}
exports.default = default_1;
//# sourceMappingURL=sheet.js.map