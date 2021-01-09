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
exports.buildAccessRouter = void 0;
const accessType = 'access';
function buildAccessRouter(router, rb) {
    rb.entityGet(router, accessType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
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
    rb.entityGet(router, 'entities', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let entities = yield runner.getEntities(unit);
        return entities;
    }));
    rb.entityGet(router, 'all-schemas', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let entities = yield runner.getAllSchemas();
        return entities;
    }));
    rb.entityGet(router, 'get-user-roles', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser } = body;
        let roles = yield runner.getUserRoles(unit, user, theUser);
        return roles;
    }));
    rb.entityGet(router, 'get-all-role-users', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let roles = yield runner.getAllRoleUsers(unit, user);
        return roles;
    }));
    rb.entityPost(router, 'set-user-roles', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser, admin, roles } = body;
        yield runner.setUserRoles(unit, user, theUser, admin, roles);
    }));
}
exports.buildAccessRouter = buildAccessRouter;
//# sourceMappingURL=access.js.map