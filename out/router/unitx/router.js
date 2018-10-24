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
const express_1 = require("express");
const processRequest_1 = require("../processRequest");
const action_1 = require("../action");
exports.router = express_1.Router();
const actionType = 'action';
function default_1(router) {
    processRequest_1.post(router, actionType, '/:name', unitxAction);
}
exports.default = default_1;
function unitxAction(unit, user, db, runner, params, body, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        let { name } = params;
        switch (name) {
            default:
                return yield action_1.processAction(unit, user, db, runner, params, body, schema);
            case 'a':
                return;
        }
    });
}
//# sourceMappingURL=router.js.map