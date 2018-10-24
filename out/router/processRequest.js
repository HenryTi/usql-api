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
function post(router, entityType, path, processer) {
    router.post(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, entityType, processer, false);
    }));
}
exports.post = post;
;
function get(router, entityType, path, processer) {
    router.get(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, entityType, processer, true);
    }));
}
exports.get = get;
;
function put(router, entityType, path, processer) {
    router.put(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, entityType, processer, false);
    }));
}
exports.put = put;
;
function process(req, res, entityType, processer, isGet) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userToken = req.user;
            let { db, id: userId, unit } = userToken;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let { params } = req;
            let { name } = params;
            let call, run;
            if (name !== undefined) {
                let schema = runner.getSchema(name);
                if (schema === undefined)
                    return router_1.unknownEntity(res, name);
                call = schema.call;
                run = schema.run;
                if (router_1.validEntity(res, call, entityType) === false)
                    return;
            }
            let body = isGet === true ? req.query : req.body;
            let result = yield processer(unit, userId, name, db, params, runner, body, call, run);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
}
//# sourceMappingURL=processRequest.js.map