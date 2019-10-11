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
//import { afterAction } from '../queue';
const core_1 = require("../core");
function actionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
        /*
        let {data} = body;
        if (data === undefined) {
            console.log('action process data: ', body);
            data = packParam(schema, body);
        }
        console.log('action process param: ', data);
        let result = await runner.action(name, unit, user, data);
        */
        //let returns = schema.returns;
        //let {hasSend,  busFaces, templets} = run;
        //let actionReturn = await afterAction(db, runner, unit, returns, hasSend, busFaces, templets, result);
        //let {busFaces} = run;
        //let actionReturn = await afterAction(db, runner, unit, returns, busFaces, result);
        //return actionReturn;
        let arr0 = result[0];
        if (arr0 === undefined || arr0.length === 0)
            return;
        return arr0[0];
    });
}
exports.actionProcess = actionProcess;
;
function actionReturns(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data } = body;
        if (data === undefined) {
            console.log('action process data: ', body);
            data = core_1.packParam(schema, body);
        }
        console.log('action process param: ', data);
        let result = yield runner.action(name, unit, user, data);
        return result;
    });
}
exports.actionReturns = actionReturns;
//# sourceMappingURL=actionProcess.js.map