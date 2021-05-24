"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTestRouterBuilder = exports.compileProdRouterBuilder = exports.unitxTestRouterBuilder = exports.unitxProdRouterBuilder = exports.uqTestRouterBuilder = exports.uqProdRouterBuilder = exports.CompileRouterBuilder = exports.RouterBuilder = void 0;
const tool_1 = require("../tool");
const consts_1 = require("./consts");
const net_1 = require("./net");
;
class RouterBuilder {
    constructor(net) {
        this.process = (req, res, processer, queryOrBody, params) => __awaiter(this, void 0, void 0, function* () {
            try {
                let runner = yield this.routerRunner(req);
                if (runner === undefined)
                    return;
                let userToken = req.user;
                let result = yield processer(runner, queryOrBody, params, userToken);
                res.json({
                    ok: true,
                    res: result
                });
            }
            catch (err) {
                res.json({ error: err });
            }
        });
        this.entityProcess = (req, res, entityType, processer, isGet) => __awaiter(this, void 0, void 0, function* () {
            try {
                let userToken = req.user;
                let { db, id: userId, unit, roles } = userToken;
                if (db === undefined)
                    db = consts_1.consts.$unitx;
                let runner = yield this.checkRunner(db);
                if (runner === undefined)
                    return;
                let { params } = req;
                let { name } = params;
                let call, run;
                if (name !== undefined) {
                    name = name.toLowerCase();
                    let schema = runner.getSchema(name);
                    if (schema === undefined) {
                        return this.unknownEntity(res, name, runner);
                    }
                    call = schema.call;
                    run = schema.run;
                    if (this.validEntity(res, call, entityType) === false)
                        return;
                }
                let result;
                let modifyMax;
                let $uq;
                let app = req.header('app');
                let $roles;
                if (roles) {
                    $roles = yield runner.getRoles(unit, app, userId, roles);
                }
                let entityVersion = req.header('en');
                let uqVersion = req.header('uq');
                let eqEntity = entityVersion === undefined || call.version === Number(entityVersion);
                let eqUq = uqVersion === undefined || runner.uqVersion === Number(uqVersion);
                if (eqEntity === true && eqUq === true) {
                    let body = isGet === true ? req.query : req.body;
                    result = yield processer(unit, userId, name, db, params, runner, body, call, run, this.net);
                }
                else {
                    $uq = {};
                    if (eqEntity === false) {
                        $uq.entity = call;
                    }
                    if (eqUq === false) {
                        let access = yield runner.getAccesses(unit, userId, undefined);
                        $uq.uq = access;
                    }
                }
                modifyMax = yield runner.getModifyMax(unit);
                res.json({
                    ok: true,
                    res: result,
                    $modify: modifyMax,
                    $uq: $uq,
                    $roles: $roles,
                });
            }
            catch (err) {
                tool_1.logger.error(err);
                res.json({ error: err });
            }
        });
        this.net = net;
    }
    post(router, path, processer) {
        router.post(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            let { body, params } = req;
            yield this.process(req, res, processer, body, params);
        }));
    }
    ;
    get(router, path, processer) {
        router.get(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            let { query, params } = req;
            yield this.process(req, res, processer, query, params);
        }));
    }
    ;
    put(router, path, processer) {
        router.put(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
            let { body, params } = req;
            yield this.process(req, res, processer, body, params);
        }));
    }
    ;
    getDbName(name) { return this.net.getDbName(name); }
    routerRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = req.params.db;
            let runner = yield this.checkRunner(db);
            let uqVersion = req.header('tonva-uq-version');
            if (uqVersion !== undefined) {
                let n = Number(uqVersion);
                if (n !== NaN) {
                    runner.checkUqVersion(n);
                }
            }
            return runner;
        });
    }
    entityPost(router, entityType, path, processer) {
        router.post(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    entityGet(router, entityType, path, processer) {
        router.get(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, true);
        }));
    }
    ;
    entityPut(router, entityType, path, processer) {
        router.put(`/${entityType}${path}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.entityProcess(req, res, entityType, processer, false);
        }));
    }
    ;
    checkRunner(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.net.getRunner(db);
            if (runner !== undefined)
                return runner;
            throw `Database ${this.net.getDbName(db)} 不存在`;
        });
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.net.getRunner(name);
        });
    }
    getUnitxRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.net.getUnitxRunner();
        });
    }
    unknownEntity(res, name, runner) {
        res.json({ error: `uq:${runner.name} unknown entity ${name} all entities:${runner.getEntityNameList()}` });
    }
    validEntity(res, schema, type) {
        if (schema.type === type)
            return true;
        if (type === 'schema')
            return true;
        res.json({ error: schema.name + ' is not ' + type });
        return false;
    }
}
exports.RouterBuilder = RouterBuilder;
class CompileRouterBuilder extends RouterBuilder {
}
exports.CompileRouterBuilder = CompileRouterBuilder;
class UnitxRouterBuilder extends RouterBuilder {
    routerRunner(req) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.net.getUnitxRunner();
            if (runner !== undefined)
                return runner;
            throw `Database ${this.net.getDbName('$unitx')} 不存在`;
        });
    }
}
exports.uqProdRouterBuilder = new RouterBuilder(net_1.prodNet);
exports.uqTestRouterBuilder = new RouterBuilder(net_1.testNet);
exports.unitxProdRouterBuilder = new UnitxRouterBuilder(net_1.prodNet);
exports.unitxTestRouterBuilder = new UnitxRouterBuilder(net_1.testNet);
exports.compileProdRouterBuilder = new CompileRouterBuilder(net_1.prodCompileNet);
exports.compileTestRouterBuilder = new CompileRouterBuilder(net_1.testCompileNet);
//# sourceMappingURL=routerBuilder.js.map