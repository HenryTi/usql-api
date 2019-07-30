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
function buildBuildRouter(router, rb) {
    rb.post(router, '/start', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { enc } = body;
        core_1.setUqBuildSecret(enc);
    }));
    rb.post(router, '/finish', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        let { uqId } = runner;
        let { uqId: paramUqId } = body;
        if (!uqId) {
            yield runner.setSetting(0, 'uqId', String(paramUqId));
            uqId = paramUqId;
        }
        yield runner.initSetting();
        if (uqId !== Number(paramUqId)) {
            debugger;
            throw 'error uqId';
        }
        runner.reset();
    }));
    rb.post(router, '/sql', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //return this.db.sql(sql, params);
        let { sql, params } = body;
        return yield runner.sql(sql, params);
    }));
    rb.post(router, '/build-database', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        yield runner.buildDatabase();
    }));
    rb.post(router, '/create-database', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        yield runner.createDatabase();
    }));
    rb.post(router, '/exists-databse', (runner) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.existsDatabase();
    }));
    rb.post(router, '/set-setting', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        for (let i in body) {
            promises.push(runner.setSetting(0, i, body[i]));
        }
        yield Promise.all(promises);
    }));
    rb.get(router, '/setting', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //let ret = await this.unitTableFromProc('tv_$get_setting', unit, [name]);
        let ret = yield runner.getSetting(0, body.name);
        if (ret.length === 0)
            return undefined;
        return ret[0].value;
    }));
    rb.get(router, '/entitys', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //return await this.db.call('tv_$entitys', [hasSource===true? 1:0]);
        return yield runner.loadSchemas(Number(body.hasSource));
    }));
    rb.post(router, '/entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        //let params = [user, id, name, type, schema, run, source, from, open];
        let { id, name, type, schema, run, source, from, open } = body;
        //unit:number, user:number, */id:number, name:string, type:number, schema:string, run:string, source:string, from:string, open:number
        return yield runner.saveSchema(0, 0, id, name, type, schema, run, source, from, open);
    }));
    rb.get(router, '/const-strs', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.loadConstStrs();
    }));
    rb.get(router, '/const-str', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.saveConstStr(body.type);
    }));
    rb.get(router, '/entity-version', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { name, version } = body;
        return yield runner.loadSchemaVersion(name, version);
    }));
    rb.post(router, '/entity-validate', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.setEntityValid(body.entities);
    }));
    /*
    rb.post(router, '/save-face',
    async (runner:Runner, body:{bus:string, busOwner:string, busName:string, faceName:string}) => {
        let {bus, busOwner, busName, faceName} = body;
        await runner.saveFace(bus, busOwner, busName, faceName);
    });
    */
}
exports.buildBuildRouter = buildBuildRouter;
;
//# sourceMappingURL=router.js.map