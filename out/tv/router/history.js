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
const core_1 = require("../../core");
const router_1 = require("./router");
function default_1(router) {
    router.post('/history/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = req.user;
            let db = user.db;
            let { name } = req.params;
            let body = req.body;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            if (schema === undefined)
                return router_1.unknownEntity(res, name);
            let callSchema = schema.call;
            if (router_1.validEntity(res, callSchema, 'history') === false)
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
}
exports.default = default_1;
//# sourceMappingURL=history.js.map