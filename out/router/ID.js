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
exports.buildIDRouter = void 0;
function buildIDRouter(router, rb) {
    rb.entityPost(router, 'id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.ID(body);
        return result;
    }));
    rb.entityPost(router, 'key-id', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.KeyID(body);
        return result;
    }));
    rb.entityPost(router, 'id2', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.ID2(body);
        return result;
    }));
    rb.entityPost(router, 'key-id2', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.KeyID2(body);
        return result;
    }));
    rb.entityPost(router, 'id-log', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDLog(body);
        return result;
    }));
    rb.entityPost(router, 'id-acts', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDActs(body);
        return result;
    }));
    rb.entityPost(router, 'id-detail', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.IDDetail(unit, user, body);
        return result;
    }));
}
exports.buildIDRouter = buildIDRouter;
//# sourceMappingURL=ID.js.map