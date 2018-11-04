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
const express_1 = require("express");
const router_1 = require("../router");
//import { post } from '../process';
exports.router = express_1.Router({ mergeParams: true });
(function (router) {
    post(router, '/access-user', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-user';
        console.log(body);
        let { unit, entity, users } = body;
        yield runner.call('$set_access_user', [unit, entity, users, undefined]);
    }));
    post(router, '/access-entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-entity';
        console.log(body);
        let { unit, entities } = body;
        yield runner.call('$set_access_entity', [unit, entities]);
    }));
    post(router, '/access-fully', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'seting/access-fully *** ---';
        console.log(body);
        let { unit, user, flag } = body;
        yield runner.call('$set_access_fully', [unit, user, flag]);
    }));
})(exports.router);
function post(router, path, processer) {
    router.post(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function get(router, path, processer) {
    router.get(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function put(router, path, processer) {
    router.put(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function process(req, res, processer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //let userToken:User = (req as any).user;
            //let {db, id:userId, unit} = userToken;
            let db = req.params.db;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let body = req.body;
            let result = yield processer(runner, body);
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
//# sourceMappingURL=router.js.map