import {Runner} from '../usql/runner';
import {SchemaBusFace} from '../usql/schemaBusFace';
import {queue} from './queue';
import { packBus } from '../core/packReturn';
import { wsSendMessage } from '../ws';

// 2018-02-25
// Bus face 数据保全的说明：
// bus数据的产生，应该跟action或者sheetAction构成事务。
// 所以，应该把bus face 信息在事务内写数据库。
// 在job queue里面，读数据，然后发送到unitx，然后再从数据库删除。这样保证不会丢失信息。
// 当下为了快速写出程序，暂时先简单处理。数据库操作返回数据，直接发送unitx，可能会有数据丢失。

export async function afterAction(db:string, runner: Runner, unit:number, returns:any[], hasSend, busFaces:SchemaBusFace[], result:any):Promise<any> {
    let nFaceCount:number = 0;
    let resArrs = result as any[][];
    if (hasSend === true) {
        // 处理发送信息
        let messages = resArrs.shift();
        let proc = runner.isSysChat === true? sendToChat : mailToChat;
        function sendToChat(row:any) {
            // 通过websocket送回界面
            let {to, msg} = row;
            wsSendMessage(db, unit, to, {
                type: 'msg',
                unit: unit,
                data: msg
            });
        }
        function mailToChat(row:any) {
            // 通过face邮件发送到chat服务器
        }
        for (let row of messages) proc(row);
    }
    if (busFaces === undefined || busFaces.length === 0) {
        return result[0];
    }
    for (let i in busFaces) {
        let {name:busName, owner, bus, faces} = busFaces[i];
        let schema = runner.getSchema(busName);
        for (let j in faces) {
            let {name, arr} = faces[j];
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
            let busSchema = schema.call.schema[name]
            let packedBusData = packBus(busSchema, main);
            //await runBusFace(unit, bus, name, main);
            await queue.add({
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
}
