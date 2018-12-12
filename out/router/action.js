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
const entityProcess_1 = require("./entityProcess");
const actionProcess_1 = require("./actionProcess");
const unitx_1 = require("./unitx");
const actionType = 'action';
function default_1(router) {
    entityProcess_1.entityPost(router, actionType, '/:name', (unit, user, name, db, urlParams, runner, body, schema, run) => __awaiter(this, void 0, void 0, function* () {
        if (db === '$unitx')
            return yield unitx_1.unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    }));
    entityProcess_1.entityPost(router, actionType, '-json/:name', (unit, user, name, db, urlParams, runner, body, schema, run) => __awaiter(this, void 0, void 0, function* () {
        if (db === '$unitx')
            return yield unitx_1.unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
        return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    }));
}
exports.default = default_1;
//# sourceMappingURL=action.js.map