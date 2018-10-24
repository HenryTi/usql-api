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
const processRequest_1 = require("./processRequest");
function default_1(router) {
    //router.get('/schema/:name', async (req:Request, res:Response) => {
    processRequest_1.get(router, 'schema', '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        return schema;
    }));
    /*
    router.post('/schema', async (req:Request, res:Response) => {
        let user:User = (req as any).user;
        let db = user.db;
        let {body} = req;
        let runner = await checkRunner(db, res);
        //let schema = runner.getSchema(name);
        //if (schema === undefined) return unknownEntity(res, name);
        //let call = schema.call;
        res.json({
            ok: true,
            res: (body as string[]).map(name => (runner.getSchema(name)||{}).call),
        });
    });
    */
    //router.get('/schema/:name/:version', async (req:Request, res:Response) => {
    processRequest_1.get(router, 'schema', '/:name/:version', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { version } = urlParams;
        let schemaVersion = yield runner.loadSchemaVersion(name, version);
        return schemaVersion;
    }));
}
exports.default = default_1;
//# sourceMappingURL=schema.js.map