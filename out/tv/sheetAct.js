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
const ws_1 = require("../ws");
const runner_1 = require("../usql/runner");
const afterAction_1 = require("./afterAction");
const util_1 = require("util");
function sheetAct(jobData) {
    return __awaiter(this, void 0, void 0, function* () {
        let { db, sheet, state, action, unit, user, id, flow } = jobData;
        let runner = yield runner_1.getRunner(db);
        if (runner === undefined) {
            console.log('sheetAct: ', db + ' is not valid');
            return;
        }
        try {
            let result = yield runner.sheetAct(sheet, state, action, unit, user, id, flow);
            let schema = yield runner.getSchema(sheet);
            if (schema === undefined) {
                console.error('job queue sheet action error: schema %s is unknow', sheet);
                return;
            }
            let { call, run } = schema;
            console.log('sheetAct: ', JSON.stringify(result[0]));
            let stateSchema = call.states.find(v => v.name === state);
            if (stateSchema === undefined) {
                console.error('job queue sheet action error: schema %s.%s is unknow', sheet, state);
                return;
            }
            let actionSchema = stateSchema.actions.find(v => v.name === action);
            if (actionSchema === undefined) {
                console.error('job queue sheet action error: schema %s.%s.%s is unknow', sheet, state, action);
                return;
            }
            run = run.run;
            let stateRun = run[state];
            if (stateRun === undefined) {
                console.error('job queue sheet action error: run %s.%s is unknow', sheet, state);
                return;
            }
            let actionRun = stateRun[action];
            if (actionRun === undefined) {
                console.error('job queue sheet action error: run %s.%s.%s is unknow', sheet, state, action);
                return;
            }
            let hasSend, busFaces;
            if (util_1.isArray(actionRun) === true) {
                hasSend = false;
                busFaces = actionRun;
            }
            else {
                hasSend = actionRun.hasSend;
                busFaces = actionRun.busFaces;
            }
            let actionReturn = yield afterAction_1.afterAction(db, runner, unit, actionSchema.returns, hasSend, busFaces, result);
            let msg = {
                $type: 'sheetAct',
                $user: user,
                $unit: unit,
            };
            let ar = actionReturn;
            if (ar !== undefined) {
                for (let i in ar)
                    msg[i] = ar[i];
            }
            yield ws_1.wsSendMessage(db, msg);
        }
        catch (err) {
            console.log('sheet Act error: ', err);
        }
        ;
    });
}
exports.sheetAct = sheetAct;
//# sourceMappingURL=sheetAct.js.map