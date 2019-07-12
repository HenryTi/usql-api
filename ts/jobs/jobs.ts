import * as _ from 'lodash';
import { Runner, getRunner } from "../db";
import { Db, isDevelopment } from "../db/db";
import { centerApi } from "../core";
import { sendToUnitx } from '../core/sendToUnitx';
import { BusMessage } from '../queue';
import { syncTuids } from './syncTuids';
import { syncBus } from './syncBus';
import { SheetQueueData } from '../core/busQueueSeed';

let firstRun: number = isDevelopment === true? 3000 : 30*1000;
let runGap: number = isDevelopment === true? 15*1000 : 30*1000;

enum Finish {
    succeed = 1,
    retry = 2,
    fail = 3,
}

export class Jobs {
    static start(): void {
        setTimeout(async ()=>{
            await new Jobs().run();
        }, firstRun);
    }

    private run = async (): Promise<void> => {
        try {
            if (isDevelopment===true) console.log('Jobs run at: ', new Date());
            let db = new Db(undefined);
            let uqs = await db.uqDbs();
            for (let uqRow of uqs) {
                let runner = await getRunner(uqRow.db);
                if (runner === undefined) continue;
                await runner.init();
                await this.processQueue(runner);
                await syncBus(runner);
                await syncTuids(runner);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setTimeout(this.run, runGap);
        }
    }

    private async processQueue(runner: Runner): Promise<void> {
        try {
            let start = 0;
            for (;;) {
                let ret = await runner.call('$message_queue_get',  [start]);
                if (ret.length === 0) break;
                let procMessageQueueSet = 'tv_$message_queue_set';
                for (let row of ret) {
                    // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
                    let {$unit, id, action, subject, content, tries, update_time, now} = row;
                    start = id;
                    if (!$unit) $unit = runner.uniqueUnit;
                    if (tries > 0) {
                        // 上次尝试之后十分钟内不尝试
                        if (now - update_time < tries * 10 * 60) continue;
                    }
                    let finish:Finish;
                    if (!content) {
                        // 如果没有内容，直接进入failed
                        finish = Finish.fail;
                    }
                    else {
                        try {
                            switch (action) {
                                default:
                                    await this.processItem(runner, $unit, id, action, subject, content, update_time);
                                    break;
                                case 'email':
                                    await this.email(runner, $unit, id, content);
                                    finish = Finish.succeed;
                                    break;
                                case 'bus':
                                    await this.bus(runner, $unit, id, subject, content);
                                    finish = Finish.succeed;
                                    break;
                                case 'sheet':
                                    await this.sheet(runner, content);
                                    finish = Finish.succeed;
                                    break;
                            }
                        }
                        catch (err) {
                            if (tries < 5) {
                                finish = Finish.retry; // retry
                            }
                            else {
                                finish = Finish.fail;  // fail
                            }
                        }
                    }
                    if (finish !== undefined) await runner.unitCall(procMessageQueueSet, $unit, id, finish); 
                }
            }
        }
        catch (err) {
            if (isDevelopment===true) console.log(err);
        }
    }

    private async processItem(runner:Runner, unit:number, id:number, action:string, subject:string, content:string, update_time:Date): Promise<void> {
        let json:any = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        console.log('queue item: ', unit, id, action, subject, json);
    }

    private values(content:string):any {
        let json:any = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        return json;
    }

    private async email(runner:Runner, unit:number, id:number, content:string): Promise<void> {
        let values = this.values(content);
        let {$isUser, $to, $cc, $bcc, $templet} = values;
        if (!$to) return;
        let schema = runner.getSchema($templet);
        if (schema === undefined) {
            debugger;
            throw 'something wrong';
        }
        let {subjectSections, sections} = schema.call;
        let mailSubject = stringFromSections(subjectSections, values);
        let mailBody = stringFromSections(sections, values);

        await centerApi.send({
            isUser: $isUser === '1',
            type: 'email',
            subject: mailSubject,
            body: mailBody,
            to: $to,
            cc: $cc,
            bcc: $bcc
        });
    }

    private async bus(runner:Runner, unit:number, id:number, subject:string, content:string): Promise<void> {
        if (!unit) return;
        
        let parts = subject.split('/');
        let busEntityName = parts[0];
        let face = parts[1];

        let schema = runner.getSchema(busEntityName);
        if (schema === undefined) {
            debugger;
            throw 'something wrong';
        }
        let {schema:busSchema, busOwner, busName} = schema.call;

        let {uqOwner, uq} = runner;

        let body = toBusMessage(busSchema, face, content);
        let message: BusMessage = {
            unit: unit,
            type: 'bus',
            queueId: id,
            from: uqOwner + '/' + uq,           // from uq
            busOwner: busOwner,
            bus: busName,
            face: face,
            body: body,
        };
        await sendToUnitx(unit, message);
    }

    private async sheet(runner: Runner, content:string):Promise<void> {
        let sheetQueueData:SheetQueueData = JSON.parse(content);
        let {id, sheet, state, action, unit, user, flow} = sheetQueueData;
        let result = await runner.sheetAct(sheet, state, action, unit, user, id, flow);
    }
}

function stringFromSections(sections:string[], values: any):string {
    if (sections === undefined) return;
    let ret:string[] = [];
    let isValue:boolean = false;
    for (let section of sections) {
        if (isValue === true) {
            ret.push(values[section] || '');
            isValue = false;
        }
        else {
            ret.push(section);
            isValue = true;
        }
    }
    return ret.join('');
}

function toBusMessage(busSchema:any, face:string, content:string):string {
    if (!content) return '';
    let faceSchema = busSchema[face];
    if (faceSchema === undefined) {
        debugger;
        throw 'something wrong';
    }
    let data:{[key:string]: string[]}[] = [];
    let p = 0;
    let part:{[key:string]: string[]};
    for (;;) {
        let t = content.indexOf('\t', p);
        if (t<0) break;
        let key = content.substring(p, t);
        ++t;
        let n = content.indexOf('\n', t);
        let sec = content.substring(t, n<0? undefined: n);
        if (key === '$') {
            if (part !== undefined) data.push(part);
            part = {$: [sec]};
        }
        else {
            if (part !== undefined) {
                let arr = part[key];
                if (arr === undefined) {
                    part[key] = arr = [];
                }
                arr.push(sec);
            }
        }
        if (n<0) break;
        p = n+1;
    }
    if (part !== undefined) data.push(part);

    let {fields, arrs} = faceSchema;
    let ret:string = '';
    for (let item of data) {
        ret += item['$'];
        ret += '\n';
        if (arrs === undefined) continue;
        for (let arr of arrs) {
            let arrRows = item[arr.name];
            if (arrRows !== undefined) {
                for (let ar of arrRows) {
                    ret += ar;
                    ret += '\n';
                }
            }
            ret += '\n';
        }
        ret += '\n';
    }

    return ret;
}
