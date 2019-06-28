import * as _ from 'lodash';
import { packBus } from '../core';
import { Runner } from '../db/runner';
import { pushToClient } from './pushToClient';
import { MsgMessage, BusMessage } from './model';
import { queueToUnitx } from './toUnitxQueue';

// 2018-02-25
// Bus face 数据保全的说明：
// bus数据的产生，应该跟action或者sheetAction构成事务。
// 所以，应该把bus face 信息在事务内写数据库。
// 在job queue里面，读数据，然后发送到unitx，然后再从数据库删除。这样保证不会丢失信息。
// 当下为了快速写出程序，暂时先简单处理。数据库操作返回数据，直接发送unitx，可能会有数据丢失。
// git

export interface SchemaBusFace {
    name:string;
    owner:string;
    bus:string;
    faces: {
        name: string;
        arr: string[];
    }[];
}
export interface TempletFace {
    templet: string;
    params: string[];
}
export async function afterAction(
    db:string,
    runner: Runner, 
    unit:number,
    schemaReturns:any[],
    hasMessage:boolean,
    busFaces:SchemaBusFace[],
    templetFaces:TempletFace[],
    result:any):Promise<any>
{
    let nFaceCount:number = 0;
    let resArrs = result as any[][];
    if (hasMessage === true) {
        // 处理发送信息
        let messages = resArrs.shift();
        // 将执行操作action，或者sheetAction产生的消息，发送给最终用户的客户端
        for (let row of messages) {
            let {from, to, msg, action, data, notify} = row;
            let infoMsg:MsgMessage = {
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
            await pushToClient(infoMsg);
            //await pushToCenter(wsMsg);
            //await queueUnitx(wsMsg);
            console.log('ws send db=%s unit=%s to=%s msg=%s', db, unit, to, JSON.stringify(infoMsg));
        }
    }

    if (busFaces !== undefined && busFaces.length > 0) {
        // 发送face消息，子系统间的数据交换
        for (let busFace of busFaces) {
            let {name:busName, owner, bus, faces} = busFace;
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
                let from = (runner.uqOwner || 'unknown') + '/' + (runner.uq || 'unknown');
                let busMsg: BusMessage = {
                    unit: unit,
                    type: 'bus',
                    from: from,
                    busOwner: owner,
                    bus: bus,
                    face: name,
                    body: packedBusData
                }
                await queueToUnitx(busMsg);
            }
        }
    }

    if (templetFaces !== undefined) {
        for (let templetFace of templetFaces) {
            let res = resArrs.shift();
            let {templet} = templetFace;
            let templetSchema = runner.getSchema(templet).schema;
            for (let row of res) {
                await sendTemplet(templetSchema, row);
            }
        }
    }

    let arr0 = result[0];
    if (arr0 === undefined || arr0.length === 0) return;
    return arr0[0];
}

async function sendTemplet(templetRun: any, values:any) {
    let {subjectSections, sections} = templetRun;
    let {$method, $to, $cc, $bcc} = values;
    let subject = stringFromSections(subjectSections, values);
    let body = stringFromSections(sections, values);

}

function stringFromSections(sections:string[], values: any):string {
    if (sections === undefined) return;
}
