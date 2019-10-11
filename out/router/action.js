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
//import { entityPost } from './entityProcess';
const actionProcess_1 = require("./actionProcess");
const unitx_1 = require("./unitx");
//import { packParam } from '../core/packParam';
const actionType = 'action';
function buildActionRouter(router, rb) {
    rb.entityPost(router, actionType, '/:name', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        if (db === core_1.consts.$unitx)
            return yield unitx_1.unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    }));
    rb.entityPost(router, actionType, '/:name/returns', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        if (db === core_1.consts.$unitx)
            return yield unitx_1.unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return yield actionProcess_1.actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
    }));
    rb.entityPost(router, actionType, '-json/:name', (unit, user, name, db, urlParams, runner, body, schema, run, net) => __awaiter(this, void 0, void 0, function* () {
        if (db === core_1.consts.$unitx)
            return yield unitx_1.unitxActionProcess(unit, user, name, db, urlParams, runner, body, schema, run, net);
        return yield actionProcess_1.actionProcess(unit, user, name, db, urlParams, runner, body, schema, run);
    }));
}
exports.buildActionRouter = buildActionRouter;
//# sourceMappingURL=action.js.map