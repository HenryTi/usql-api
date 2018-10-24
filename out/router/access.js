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
const accessType = 'access';
function default_1(router) {
    processRequest_1.get(router, accessType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        //let {acc} = '*'; //(req as any).query;
        let { acc } = body;
        let accs = undefined;
        if (acc !== undefined) {
            accs = acc.split('|');
            if (accs.length === 1 && accs[0].trim().length === 0)
                accs = undefined;
        }
        let access = yield runner.getAccesses(accs);
        return access;
    }));
}
exports.default = default_1;
//# sourceMappingURL=access.js.map