import * as _ from 'lodash';
import {Runner} from './runner';
import {SchemaBusFace} from './schemaBusFace';
import { addUnitxOutQueue } from './outQueue';
import { packBus } from '../core';
import { wsSendMessage } from '../core';

// 2018-02-25
// Bus face 数据保全的说明：
// bus数据的产生，应该跟action或者sheetAction构成事务。
// 所以，应该把bus face 信息在事务内写数据库。
// 在job queue里面，读数据，然后发送到unitx，然后再从数据库删除。这样保证不会丢失信息。
// 当下为了快速写出程序，暂时先简单处理。数据库操作返回数据，直接发送unitx，可能会有数据丢失。

export async function sendMessagesAfterAction(
    db:string,
    runner: Runner, 
    unit:number,
    returns:any[], 
    hasMessage:boolean,
    busFaces:SchemaBusFace[],
    result:any):Promise<any> 
{
    let nFaceCount:number = 0;
    let resArrs = result as any[][];
    if (hasMessage === true) {
        // 处理发送信息
        let messages = resArrs.shift();
        //let proc = runner.isSysChat === true? sendToChat : mailToChat;
        /*
        async function sendToChat(row:any) {
            // 通过websocket送回界面
            let {to, msg, action, data, notify} = row;
            let wsMsg = {
                $type: 'msg',
                $user: to,
                $unit: unit,
                $io: notify,
                msg: msg,
                action: action,
                data: data,
            };
            await wsSendMessage(db, wsMsg);
            console.log('ws send db=%s unit=%s to=%s msg=%s', db, unit, to, JSON.stringify(wsMsg));
        }
        async function mailToChat(row:any) {
            // 通过face邮件发送到chat服务器
        }
        */
        // 将执行操作action，或者sheetAction产生的消息，发送给最终用户的客户端
        for (let row of messages) {
            //await proc(row);
            let {to, msg, action, data, notify} = row;
            let wsMsg = {
                $type: 'msg',
                $user: to,
                $unit: unit,
                $io: notify,
                msg: msg,
                action: action,
                data: data,
            };
            await wsSendMessage(db, wsMsg);
            console.log('ws send db=%s unit=%s to=%s msg=%s', db, unit, to, JSON.stringify(wsMsg));
        }
    }

    let sheetArr = resArrs[resArrs.length - 1];
    let sheet = sheetArr[0];
    if (sheet !== undefined) {
        await addUnitxOutQueue(_.merge({
            $job: 'sheet',
            $unit: unit,
            data: {
                type: 'sheet',
                subject: '单据',
                discription: '发送过来的单据',
                content: '{a:1, b:2}',
                meName: 'henry',
                meNick: 'henry-nick',
                meIcon: undefined,
                to: [
                    {toUser: 4},
                    {toUser: 3},
                ],
                cc: [
                    {ccUser: 1},
                    {ccUser: 2},
                ],
            }        
        }, sheet));
    }

    if (busFaces === undefined || busFaces.length === 0) {
        return result[0];
    }
    // 发送face消息，子系统间的数据交换
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
            await addUnitxOutQueue({
                $job: 'bus',
                $unit: unit,
                busOwner: owner,
                bus: bus,
                face: name,
                data: packedBusData
            });
        }
    }
    return result[0][0];
}
