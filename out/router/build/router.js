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
exports.buildBuildRouter = void 0;
const core_1 = require("../../core");
const core_2 = require("../../core");
function buildBuildRouter(router, rb) {
    router.post('/start', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            yield core_1.prodNet.runnerCompiling(db);
            yield core_1.testNet.runnerCompiling(db);
            let { enc } = req.body;
            core_1.setUqBuildSecret(enc);
            let runner = new core_2.BuildRunner(db);
            let exists = yield runner.buildDatabase();
            res.json({
                ok: true,
                res: exists
            });
        }
        catch (err) {
            res.json({
                error: err,
            });
        }
    }));
    router.post('/build-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let exists = yield runner.buildDatabase();
            res.json({
                ok: true,
                res: {
                    exists: exists,
                }
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    router.post('/finish', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let { uqId: paramUqId, uqVersion } = req.body;
            yield Promise.all([
                runner.setSetting(0, 'uqId', String(paramUqId)),
                runner.setSetting(0, 'uqVersion', String(uqVersion))
            ]);
            yield runner.initSetting();
            yield core_1.prodNet.resetRunnerAfterCompile(db);
            yield core_1.testNet.resetRunnerAfterCompile(db);
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({
                error: err,
            });
        }
    }));
    router.post('/sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let { sql, params } = req.body;
            let result = yield runner.sql(sql, params);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
        rb.post(router, '/sql',
            async (runner:EntityRunner, body:{sql:string, params:any[]}): Promise<any> => {
            //return this.db.sql(sql, params);
            let {sql, params} = body;
            return await runner.sql(sql, params);
        });
    */
    router.post('/proc-sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let { name, proc, isFunc } = req.body;
            let result = yield runner.procSql(name, proc);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
        rb.post(router, '/proc-sql',
        async (runner:EntityRunner, body:{name:string, proc:string}): Promise<any> => {
            //return this.db.sql(sql, params);
            let {name, proc} = body;
            return await runner.procSql(name, proc);
        });
    */
    router.post('/proc-core-sql', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let { name, proc, isFunc } = req.body;
            let result = yield runner.procCoreSql(name, proc, isFunc);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    router.post('/create-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let result = yield runner.createDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
    rb.post(router, '/create-database',
    async (runner:EntityRunner, body:any): Promise<void> => {
        await runner.createDatabase();
    });
    */
    router.post('/exists-database', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let result = yield runner.existsDatabase();
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    /*
    rb.post(router, '/exists-databse',
    async (runner:EntityRunner): Promise<boolean> => {
        return await runner.existsDatabase();
    });
    */
    //rb.post(router, '/set-setting',
    //async (runner:EntityRunner, body: {[name:string]: any}): Promise<void> => {
    router.post('/set-setting', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let promises = [];
            let { body } = req;
            let service;
            for (let i in body) {
                let v = body[i];
                if (i === 'service')
                    service = v;
                promises.push(runner.setSetting(0, i, v));
            }
            yield Promise.all(promises);
            // 取units，还有xuid的start和end
            let units = yield core_1.centerApi.serviceUnit(service);
            yield runner.setUnitAdmin(units);
            // sectionCount 从已经保存的当前xuid，和xuid-section-end 来计算
            yield runner.refreshIDSection(service);
            res.json({
                ok: true,
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    //rb.get(router, '/setting',
    //async (runner:EntityRunner, body: {name:string}):Promise<string> => {
    router.get('/setting', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let dbName = req.params.db;
            let db = core_1.Db.db(rb.getDbName(dbName));
            let runner = new core_2.BuildRunner(db);
            let ret = yield runner.getSetting(0, req.body.name);
            if (ret.length === 0)
                return undefined;
            res.json({
                ok: true,
                result: ret[0].value
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    }));
    rb.get(router, '/entitys', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //return await this.db.call('tv_$entitys', [hasSource===true? 1:0]);
        return yield runner.loadSchemas(Number(body.hasSource));
    }));
    rb.post(router, '/entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { id, name, type, schema, run, source, from, open } = body;
        let ret = yield runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open);
        return ret;
    }));
    rb.get(router, '/const-strs', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.loadConstStrs();
    }));
    // to be removed in the future
    // const # is removed when use get
    rb.get(router, '/const-str', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveConstStr(body.type);
    }));
    rb.post(router, '/const-str', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveConstStr(body.type);
    }));
    rb.get(router, '/entity-version', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { name, version } = body;
        return yield runner.loadSchemaVersion(name, version);
    }));
    rb.post(router, '/entity-validate', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { entities, valid } = body;
        return yield runner.setEntityValid(entities, valid);
    }));
    rb.post(router, '/tag-type', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { names } = body;
        yield runner.tagType(names);
    }));
    rb.post(router, '/tag-save-sys', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { data } = body;
        yield runner.tagSaveSys(data);
    }));
}
exports.buildBuildRouter = buildBuildRouter;
;
//# sourceMappingURL=router.js.map