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
const queue_1 = require("./queue");
const packReturn_1 = require("../core/packReturn");
const ws_1 = require("../ws");
// 2018-02-25
// Bus face 数据保全的说明：
// bus数据的产生，应该跟action或者sheetAction构成事务。
// 所以，应该把bus face 信息在事务内写数据库。
// 在job queue里面，读数据，然后发送到unitx，然后再从数据库删除。这样保证不会丢失信息。
// 当下为了快速写出程序，暂时先简单处理。数据库操作返回数据，直接发送unitx，可能会有数据丢失。
function afterAction(db, runner, unit, returns, hasSend, busFaces, result) {
    return __awaiter(this, void 0, void 0, function* () {
        let nFaceCount = 0;
        let resArrs = result;
        if (hasSend === true) {
            // 处理发送信息
            let messages = resArrs.shift();
            let proc = runner.isSysChat === true ? sendToChat : mailToChat;
            function sendToChat(row) {
                // 通过websocket送回界面
                let { to, msg } = row;
                ws_1.wsSendMessage(db, unit, to, {
                    type: 'msg',
                    unit: unit,
                    data: msg
                });
            }
            function mailToChat(row) {
                // 通过face邮件发送到chat服务器
            }
            for (let row of messages)
                proc(row);
        }
        if (busFaces === undefined || busFaces.length === 0) {
            return result[0];
        }
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
                let packedBusData = packReturn_1.packBus(busSchema, main);
                //await runBusFace(unit, bus, name, main);
                yield queue_1.queue.add({
                    job: 'unitx',
                    unit: unit,
                    busOwner: owner,
                    bus: bus,
                    face: name,
                    data: packedBusData
                });
            }
        }
        return result[0][0];
    });
}
exports.afterAction = afterAction;
//# sourceMappingURL=afterAction.js.map