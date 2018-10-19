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
    router.get('/schema/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
        let user = req.user;
        let db = user.db;
        let { name } = req.params;
        let runner = yield router_1.checkRunner(db, res);
        let schema = runner.getSchema(name);
        if (schema === undefined)
            return router_1.unknownEntity(res, name);
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
        let runner = yield router_1.checkRunner(db, res);
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
        let runner = yield router_1.checkRunner(db, res);
        let schema = yield runner.loadSchemaVersion(name, version);
        res.json({
            ok: true,
            res: schema,
        });
    }));
}
exports.default = default_1;
//# sourceMappingURL=schema.js.map