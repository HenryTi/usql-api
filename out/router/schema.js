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
const process_1 = require("./process");
function default_1(router) {
    process_1.get(router, '/schema/:name', (unit, user, urlParams, runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { name } = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    }));
    process_1.get(router, '/schema/:name/:version', (unit, user, urlParams, runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { name, version } = urlParams;
        let schemaVersion = yield runner.loadSchemaVersion(name, version);
        return schemaVersion;
    }));
}
exports.default = default_1;
//# sourceMappingURL=schema.js.map