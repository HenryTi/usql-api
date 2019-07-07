import * as _ from 'lodash';
import { Runner, getRunner } from "../db";
import { Db } from "../db/db";
import { centerApi } from "../core";
import { sendToUnitx } from '../core/sendToUnitx';
import { BusMessage } from '../queue';

export class Jobs {
    static start(): void {
        setTimeout(async ()=>{
            await new Jobs().run()
        }, 5*1000);
    }

    private run = async (): Promise<void> => {
        try {
            console.log('Jobs run at: ', new Date());
            let db = new Db(undefined);
            let uqs = await db.uqDbs();
            for (let uqRow of uqs) {
                let uq = uqRow.db;
                await this.processQueue(uq);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setTimeout(this.run, 30*1000);
        }
    }

    private async processQueue(uq: string): Promise<void> {
        try {
            let runner = await getRunner(uq);
            await runner.init();
            let start = 0;
            let ret = await runner.call('$message_queue_get',  [start]);
            let procMessageQueueSet = 'tv_$message_queue_set';
            for (let row of ret) {
                // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
                let {$unit, id, action, subject, content, tries, update_time} = row;
                if (tries > 0 && new Date().getTime() - update_time.getTime() < tries * 10 * 60 * 10000) continue;
                let finish:number;
                try {
                    switch (action) {
                        default:
                            await this.processItem(runner, $unit, id, action, subject, content, update_time);
                            break;
                        case 'email':
                            await this.email(runner, $unit, id, content, update_time);
                            finish = 1;
                            break;
                        case 'bus':
                            await this.bus(runner, $unit, id, subject, content, update_time);
                            break;
                    }
                }
                catch (err) {
                    if (tries < 5) {
                        finish = 2; // retry
                    }
                    else {
                        finish = 3;  // fail
                    }
                }
                if (finish !== undefined) await runner.unitCall(procMessageQueueSet, $unit, id, finish); 
            }
        }
        catch (err) {
            console.log(err);
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

    private async email(runner:Runner, unit:number, id:number, content:string, update_time:Date): Promise<void> {
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
        //await runner.unitCall(procMessageQueueSet, unit, id, finish); 
    }

    async bus(runner:Runner, unit:number, id:number, subject:string, content:string, update_time:Date): Promise<void> {
        let parts = subject.split('/');
        let message: BusMessage = {
            unit: unit,
            type: 'bus',
            from: runner.uqOwner + '/' + runner.uq,           // from uq
            busOwner: parts[0],
            bus: parts[1],
            face: parts[2],
            body: content,
        };
        await sendToUnitx(unit, message);
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
