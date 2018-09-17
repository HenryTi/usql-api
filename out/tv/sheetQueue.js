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
const config = require("config");
const runner_1 = require("./runner");
const core_1 = require("../core");
const afterAction_1 = require("./afterAction");
const outQueue_1 = require("./outQueue");
const sheetQueueName = 'sheet-queue';
let redis = config.get('redis');
exports.sheetQueue = bull(sheetQueueName, redis);
exports.sheetQueue.isReady().then(q => {
    console.log("queue: %s, redis: %s", sheetQueueName, JSON.stringify(redis));
});
exports.sheetQueue.on("error", (error) => {
    console.log('queue server: ', error);
});
exports.sheetQueue.process(function (job, done) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data } = job;
        if (data !== undefined) {
            yield sheetAct(data);
        }
        done();
    });
});
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
            // sheet action返回的最后一个table，是单据消息，要传递给unitx
            let sheetArr = result.pop();
            let sheetRet = sheetArr[0];
            if (sheetRet !== undefined) {
                yield outQueue_1.addOutQueue(_.merge({
                    $job: 'sheetMsg',
                    $unit: unit,
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
            let actionReturn = yield afterAction_1.afterAction(db, runner, unit, actionSchema.returns, hasMessage, busFaces, result);
            let msg = _.merge({
                $type: 'sheetAct',
                $user: user,
                $unit: unit,
            }, sheetRet);
            //let ar = actionReturn;
            //if (ar !== undefined) {
            //    for (let i in ar) msg[i] = ar[i];
            //}
            yield core_1.pushToCenter(db, msg);
            //await sheetDoneMessage(unit, id);
        }
        catch (err) {
            console.log('sheet Act error: ', err);
        }
        ;
    });
}
/*
async function sheetDoneMessage(unit:number, sheetId:number) {
    await addOutQueue({
        $job: 'sheetMsgDone',
        $unit: unit,
        sheet: sheetId,
    });
}
*/
function addSheetQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield exports.sheetQueue.add(msg);
    });
}
exports.addSheetQueue = addSheetQueue;
//# sourceMappingURL=sheetQueue.js.map