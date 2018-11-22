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
const bull = require("bull");
const runner_1 = require("../db/runner");
const afterAction_1 = require("./afterAction");
const toUnitxQueue_1 = require("./toUnitxQueue");
const sheetQueueName = 'sheet-queue';
let sheetQueue;
function queueSheet(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield sheetQueue.add(msg);
    });
}
exports.queueSheet = queueSheet;
function startSheetQueue(redis) {
    sheetQueue = bull(sheetQueueName, redis);
    sheetQueue.on("error", (error) => {
        console.log(sheetQueueName, error);
    });
    sheetQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            let { data } = job;
            yield doSheetAct(data);
            done();
        });
    });
    console.log('QUEUE: ' + sheetQueueName);
}
exports.startSheetQueue = startSheetQueue;
function doSheetAct(sheetAct) {
    return __awaiter(this, void 0, void 0, function* () {
        let { db, sheetHead, from } = sheetAct;
        let { id, sheet, state, action, unit, user, flow } = sheetHead;
        let runner = yield runner_1.getRunner(db);
        if (runner === undefined) {
            console.log('sheetAct: ', db + ' is not valid');
            return;
        }
        try {
            let result = yield runner.sheetAct(sheet, state, action, unit, user, id, flow);
            let schema = runner.getSchema(sheet);
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
            // sheet action返回的最后一个table，是单据消息，要传递给unitx
            let sheetArr = result.pop();
            let sheetRet = sheetArr[0];
            if (sheetRet !== undefined) {
                let sheetMsg = {
                    unit: unit,
                    type: 'sheet',
                    from: from,
                    db: db,
                    subject: sheetRet.discription,
                    body: sheetRet,
                    to: undefined,
                };
                yield toUnitxQueue_1.queueToUnitx(sheetMsg);
            }
            let hasMessage, busFaces;
            if (Array.isArray(actionRun) === true) {
                hasMessage = false;
                busFaces = actionRun;
            }
            else {
                hasMessage = actionRun.hasSend;
                busFaces = actionRun.busFaces;
                60;
            }
            yield afterAction_1.afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
        }
        catch (err) {
            console.log('sheet Act error: ', err);
        }
        ;
    });
}
//# sourceMappingURL=sheetQueue.js.map