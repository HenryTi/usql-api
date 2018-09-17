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
const runner_1 = require("../tv/runner");
const afterAction_1 = require("../tv/afterAction");
const packParam_1 = require("../core/packParam");
const unitxQueueName = 'unitx-in-queue';
let unitxInQueue;
function startUnitxInQueue(redis) {
    console.log('start queue: ', unitxQueueName);
    unitxInQueue = bull(unitxQueueName, redis);
    unitxInQueue.isReady().then(q => {
        console.log("queue: %s, redis: %s", unitxQueueName, JSON.stringify(redis));
    });
    unitxInQueue.process(function (job, done) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { data } = job;
                console.log('accept message: ', data);
                if (data !== undefined) {
                    let { $job, $unit } = data;
                    switch ($job) {
                        case 'sheetMsg':
                            yield processSheetMessage($unit, data);
                            break;
                        //case 'sheetMsgDone':
                        //    await removeSheetMessage($unit, data);
                        //    break;
                    }
                }
                done();
            }
            catch (err) {
                console.error(err);
                done(new Error(err));
            }
        });
    });
}
exports.startUnitxInQueue = startUnitxInQueue;
const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlSheetDoneMessage = 'sheetDoneMessage';
const usqlGetSheetTo = 'getSheetTo';
function processSheetMessage(unit, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner($unitx);
        let { no, discription, /*to, */ usq, id: sheet, state, user, name } = sheetMessage;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [usq, sheetName, stateName];
        let sheetTo = yield runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
        let toUsers = sheetTo.map(v => {
            return { toUser: v.to };
        });
        if (toUsers.length === 0)
            toUsers = [
                { toUser: user }
            ];
        //let toUsers = await getToUsers(user); 
        let data = {
            //type: 'sheetMsg',
            subject: discription,
            discription: no + ' - ' + stateName,
            content: JSON.stringify(sheetMessage),
            //meName: 'henry',
            //meNick: 'henry-nick',
            //meIcon: undefined,
            usq: usq,
            sheet: sheet,
            state: state,
            to: toUsers,
        };
        let toUser = 1;
        let schema = runner.getSchema(usqlSheetMessage);
        let msg = packParam_1.packParam(schema.call, data);
        let result = yield runner.action(usqlSheetMessage, unit, toUser, msg);
        let returns = schema.call.returns;
        let { hasSend, busFaces } = schema.run;
        let actionReturn = yield afterAction_1.afterAction($unitx, runner, unit, returns, hasSend, busFaces, result);
        console.log('save sheet message ', data);
        return;
    });
}
function getToUsers(toUser) {
    return __awaiter(this, void 0, void 0, function* () {
        // 调用组织结构来计算
        let ret = [];
        //let toArr:any[] = JSON.parse(toText);
        /*
        if (!toArr) {
            return [{toUser: toUser}];
        }
        for (let to of toArr) {
            switch (typeof to) {
                case 'number': ret.push({toUser: to}); break;
                case 'string': break;
            }
        }
        */
        return ret;
    });
}
function addUnitxInQueue(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield unitxInQueue.add(msg);
    });
}
exports.addUnitxInQueue = addUnitxInQueue;
//# sourceMappingURL=inQueue.js.map