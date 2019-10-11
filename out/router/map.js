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
const actionProcess_1 = require("./actionProcess");
const query_1 = require("./query");
const actionType = 'map';
function buildMapRouter(router, rb) {
    rb.entityPost(router, actionType, '/:name/add', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let actionName = name + '$add$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return yield actionProcess_1.actionProcess(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    }));
    rb.entityPost(router, actionType, '/:name/del', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let actionName = name + '$del$';
        let actionSchema = runner.getSchema(actionName);
        //return await actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return yield actionProcess_1.actionProcess(unit, user, actionName, db, urlParams, runner, body, actionSchema.call, run);
    }));
    rb.entityPost(router, actionType, '/:name/all', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let queryName = name + '$all$';
        let querySchema = runner.getSchema(queryName);
        return yield query_1.pageQueryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    }));
    rb.entityPost(router, actionType, '/:name/page', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let queryName = name + '$page$';
        let querySchema = runner.getSchema(queryName);
        return yield query_1.pageQueryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
    }));
    rb.entityPost(router, actionType, '/:name/query', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        let queryName = name + '$query$';
        let querySchema = runner.getSchema(queryName);
        let ret = yield query_1.queryProcess(unit, user, queryName, db, urlParams, runner, body, querySchema.call);
        return ret;
    }));
}
exports.buildMapRouter = buildMapRouter;
//# sourceMappingURL=map.js.map