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
const core_1 = require("../core");
const pushToClient_1 = require("./pushToClient");
const toUnitxQueue_1 = require("./toUnitxQueue");
// 2018-02-25
// Bus face 数据保全的说明：
// bus数据的产生，应该跟action或者sheetAction构成事务。
// 所以，应该把bus face 信息在事务内写数据库。
// 在job queue里面，读数据，然后发送到unitx，然后再从数据库删除。这样保证不会丢失信息。
// 当下为了快速写出程序，暂时先简单处理。数据库操作返回数据，直接发送unitx，可能会有数据丢失。
// git
function afterAction(db, runner, unit, schemaReturns, hasMessage, busFaces, result) {
    return __awaiter(this, void 0, void 0, function* () {
        let nFaceCount = 0;
        let resArrs = result;
        if (hasMessage === true) {
            // 处理发送信息
            let messages = resArrs.shift();
            // 将执行操作action，或者sheetAction产生的消息，发送给最终用户的客户端
            for (let row of messages) {
                let { from, to, msg, action, data, notify } = row;
                let infoMsg = {
                    unit: unit,
                    type: 'msg',
                    from: from,
                    to: to,
                    subject: msg,
                    body: {
                        $type: 'msg',
                        $user: to,
                        $unit: unit,
                        $io: notify,
                        msg: msg,
                        action: action,
                        data: data,
                    }
                };
                yield pushToClient_1.pushToClient(infoMsg);
                //await pushToCenter(wsMsg);
                //await queueUnitx(wsMsg);
                console.log('ws send db=%s unit=%s to=%s msg=%s', db, unit, to, JSON.stringify(infoMsg));
            }
        }
        if (busFaces !== undefined && busFaces.length > 0) {
            // 发送face消息，子系统间的数据交换
            for (let i in busFaces) {
                let { name: busName, owner, bus, faces } = busFaces[i];
                let schema = runner.getSchema(busName);
                for (let j in faces) {
                    let { name, arr } = faces[j];
                    let main = resArrs.shift();
                    nFaceCount++;
                    if (arr !== undefined) {
                        for (let k of arr) {
                            let slave = resArrs.shift();
                            for (let row of main) {
                                let id = row['$id'];
                                row[k] = slave.filter(r => r['$id'] === id);
                            }
                            nFaceCount++;
                        }
                    }
                    let busSchema = schema.call.schema[name];
                    let packedBusData = core_1.packBus(busSchema, main);
                    let from = (runner.uqOwner || 'unknown') + '/' + (runner.uq || 'unknown');
                    let busMsg = {
                        unit: unit,
                        type: 'bus',
                        from: from,
                        busOwner: owner,
                        bus: bus,
                        face: name,
                        body: packedBusData
                    };
                    yield toUnitxQueue_1.queueToUnitx(busMsg);
                }
            }
        }
        let arr0 = result[0];
        if (arr0 === undefined || arr0.length === 0)
            return;
        return arr0[0];
    });
}
exports.afterAction = afterAction;
//# sourceMappingURL=afterAction.js.map