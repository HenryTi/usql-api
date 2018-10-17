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
const _ = require("lodash");
const runner_1 = require("../tv/runner");
const packParam_1 = require("../core/packParam");
const afterAction_1 = require("../tv/afterAction");
const unitxQueue_1 = require("./unitxQueue");
const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlGetSheetTo = 'getSheetTo';
function processSheetMessage(unit, sheetMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner($unitx);
        let { no, discription, /*to, */ usq, id: sheet, state, user, name } = sheetMessage;
        // 上句中的to removed，由下面调用unitx来计算
        let sheetName = name;
        let stateName = state;
        let paramsGetSheetTo = [usq, sheetName, stateName];
        let tos = yield runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
        let prePostSame = false;
        /*
        let toUsers:{toUser:number}[] = sheetTo.map(v => {
            return {toUser: v.to}
        });
        */
        if (tos.length === 0) {
            tos.push({ to: user });
            prePostSame = true;
        }
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
            to: tos,
        };
        //let toUser = 1;
        let schema = runner.getSchema(usqlSheetMessage);
        let msg = packParam_1.packParam(schema.call, data);
        let result = yield runner.action(usqlSheetMessage, unit, user, msg);
        let returns = schema.call.returns;
        let { hasSend, busFaces } = schema.run;
        let actionReturn = yield afterAction_1.afterAction($unitx, runner, unit, returns, hasSend, busFaces, result);
        console.log('save sheet message ', data);
        // 之前设计，sheetAct消息不是usq里面推送。
        let toArr;
        if (prePostSame === true) {
            toArr = [user];
            yield queueToCenter('sheetAct', toArr, sheetMessage);
        }
        else {
            yield queueToCenter('sheetActPreState', [user], sheetMessage);
            toArr = tos.map(v => v.to);
            yield queueToCenter('sheetActState', toArr, sheetMessage);
        }
        return toArr;
    });
}
exports.processSheetMessage = processSheetMessage;
function queueToCenter(type, toArr, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let m = _.clone(msg);
        m.$type = type;
        m.$user = toArr;
        yield unitxQueue_1.queueUnitx(m);
        //await pushToCenter(m);
    });
}
//# sourceMappingURL=processSheetMessage.js.map