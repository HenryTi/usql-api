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
const queue_1 = require("../queue");
const core_1 = require("../core");
const router_1 = require("./router");
function default_1(router) {
    router.post('/action/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let user = req.user;
            let { id, db, unit } = user;
            let { name } = req.params;
            let body = req.body;
            let { data } = body;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let schema = runner.getSchema(name);
            let { call } = schema;
            if (data === undefined)
                data = core_1.packParam(call, body);
            let result = yield runner.action(name, unit, id, data);
            let returns = call.returns;
            let { hasSend, busFaces } = schema.run;
            let actionReturn = yield queue_1.afterAction(db, runner, unit, returns, hasSend, busFaces, result);
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
}
exports.default = default_1;
//# sourceMappingURL=action.js.map