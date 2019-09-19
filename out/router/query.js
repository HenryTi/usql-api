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
const core_1 = require("../core");
function buildQueryRouter(router, rb) {
    rb.entityPost(router, 'query', '/:name', exports.queryProcess);
    rb.entityPost(router, 'query', '-page/:name', exports.pageQueryProcess);
}
exports.buildQueryRouter = buildQueryRouter;
exports.queryProcess = (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(void 0, void 0, void 0, function* () {
    let params = [];
    let fields = schema.fields;
    let len = fields.length;
    for (let i = 0; i < len; i++) {
        params.push(body[fields[i].name]);
    }
    let result = yield runner.query(name, unit, user, params);
    let data = core_1.packReturn(schema, result);
    return data;
});
exports.pageQueryProcess = (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(void 0, void 0, void 0, function* () {
    let pageStart = body['$pageStart'];
    if (pageStart !== undefined) {
        let page = schema.returns.find(v => v.name === '$page');
        if (page !== undefined) {
            let startField = page.fields[0];
            if (startField !== undefined) {
                switch (startField.type) {
                    case 'date':
                    case 'time':
                    case 'datetime':
                        pageStart = new Date(pageStart);
                        break;
                }
            }
        }
    }
    let params = [pageStart, body['$pageSize']];
    let fields = schema.fields;
    let len = fields.length;
    for (let i = 0; i < len; i++) {
        params.push(body[fields[i].name]);
    }
    let result = yield runner.query(name, unit, user, params);
    let data = core_1.packReturn(schema, result);
    return data;
});
//# sourceMappingURL=query.js.map