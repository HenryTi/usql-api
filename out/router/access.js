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
const accessType = 'access';
function default_1(router) {
    entityProcess_1.entityGet(router, accessType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        try {
            let { acc } = body;
            let accs = undefined;
            if (acc !== undefined) {
                accs = acc.split('|');
                if (accs.length === 1 && accs[0].trim().length === 0)
                    accs = undefined;
            }
            console.log('getAccesses: ' + runner.getDb());
            let access = yield runner.getAccesses(unit, user, accs);
            return access;
        }
        catch (err) {
            console.error('/access&name=', name, '&db=', db, err);
            debugger;
        }
    }));
    entityProcess_1.entityGet(router, 'entities', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let entities = yield runner.getEntities(unit);
        return entities;
    }));
}
exports.default = default_1;
//# sourceMappingURL=access.js.map