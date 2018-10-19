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
const _ = require("lodash");
const runner_1 = require("./runner");
const afterAction_1 = require("./afterAction");
const toUnitxQueue_1 = require("./toUnitxQueue");
const sheetActQueueName = 'sheet-act-queue';
let sheetActQueue;
function queueSheetAct(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield sheetActQueue.add(msg);
    });
}
exports.queueSheetAct = queueSheetAct;
function startSheetActQueue(redis) {
    sheetActQueue = bull(sheetActQueueName, redis);
    sheetActQueue.on("error", (error) => {
        console.log(sheetActQueueName, error);
    });
    sheetActQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            let { data } = job;
            if (data !== undefined) {
                yield doSheetAct(data);
            }
            done();
        });
    });
    /*
    await sheetActQueue.isReady();
    console.log(sheetActQueueName, ' is ready');
    return sheetActQueue;
    */
}
exports.startSheetActQueue = startSheetActQueue;
function doSheetAct(sheetAct) {
    return __awaiter(this, void 0, void 0, function* () {
        let { db, sheetHead } = sheetAct;
        let { sheet, state, action, unit, user, id, flow } = sheetHead;
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
                yield toUnitxQueue_1.queueSheetToUnitx(_.merge({
                    $unit: unit,
                    $db: db,
                }, sheetRet));
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
            /*
            sheetAct消息不是在这里推送，而是在unitx里面推送。unitx知道推送给什么人
            let msg = _.merge({
                $type: 'sheetAct',
                $user: user,
                $unit: unit,
            }, sheetRet);
            await pushToCenter(db, msg);
            */
        }
        catch (err) {
            console.log('sheet Act error: ', err);
        }
        ;
    });
}
//# sourceMappingURL=sheetActQueue.js.map