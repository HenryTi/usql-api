import { Runner, Net, isDevelopment, centerApi, SheetQueueData, BusMessage } from "../core";
import { Finish } from "./finish";

export async function queueOut(runner: Runner): Promise<void> {
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
                    // 上次尝试之后十分钟内不尝试，按次数，时间递增
                    if (now - update_time < tries * 10 * 60) continue;
                }
                let finish:Finish;
                if (!content) {
                    // 如果没有内容，直接进入failed
                    finish = Finish.bad;
                }
                else {
                    try {
                        switch (action) {
                            default:
                                await processItem(runner, $unit, id, action, subject, content, update_time);
                                break;
                            case 'app':
                                await app(runner, $unit, id, content);
                                finish = Finish.done;
                                break;
                            case 'email':
                                await email(runner, $unit, id, content);
                                finish = Finish.done;
                                break;
                            case 'bus':
                                await bus(runner, $unit, id, subject, content);
                                finish = Finish.done;
                                break;
                            case 'sheet':
                                await sheet(runner, content);
                                finish = Finish.done;
                                break;
                        }
                    }
                    catch (err) {
                        if (tries < 5) {
                            finish = Finish.retry; // retry
                        }
                        else {
                            finish = Finish.bad;  // fail
                        }
                        let errSubject = `error on ${action}:  ${subject}`;
                        let error = typeof(err)==='object'?
                            err.message : err;
                        await runner.log($unit, errSubject, error);
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

async function processItem(runner:Runner, unit:number, id:number, action:string, subject:string, content:string, update_time:Date): Promise<void> {
    let json:any = {};
    let items = content.split('\n\t\n');
    for (let item of items) {
        let parts = item.split('\n');
        json[parts[0]] = parts[1];
    }
    console.log('queue item: ', unit, id, action, subject, json);
}

function jsonValues(content:string):any {
    let json:any = {};
    let items = content.split('\n\t\n');
    for (let item of items) {
        let parts = item.split('\n');
        json[parts[0]] = parts[1];
    }
    return json;
}

async function app(runner:Runner, unit:number, id:number, content:string):Promise<void> {
    await centerApi.send({
        type: 'app',
        unit: unit,
        body: content,
    });
}

async function email(runner:Runner, unit:number, id:number, content:string): Promise<void> {
    let values = jsonValues(content);
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

async function bus(runner:Runner, unit:number, id:number, subject:string, content:string): Promise<void> {
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

    let {body, version} = toBusMessage(busSchema, face, content);
    let message: BusMessage = {
        unit: unit,
        type: 'bus',
        queueId: id,
        from: uqOwner + '/' + uq,           // from uq
        busOwner: busOwner,
        bus: busName,
        face: face,
        version: version,
        body: body,
    };
    await runner.net.sendToUnitx(unit, message);
}

async function sheet(runner: Runner, content:string):Promise<void> {
    let sheetQueueData:SheetQueueData = JSON.parse(content);
    let {id, sheet, state, action, unit, user, flow} = sheetQueueData;
    let result = await runner.sheetAct(sheet, state, action, unit, user, id, flow);
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

function toBusMessage(busSchema:any, face:string, content:string):{body:string;version:number} {
    if (!content) return undefined;
    let faceSchema = busSchema[face];
    if (faceSchema === undefined) {
        debugger;
        throw 'toBusMessage something wrong';
    }
    let data:{[key:string]: string[]}[] = [];
    let p = 0;
    let part:{[key:string]: string[]};
    let busVersion:number;
    for (;;) {
        let t = content.indexOf('\t', p);
        if (t<0) break;
        let key = content.substring(p, t);
        ++t;
        let n = content.indexOf('\n', t);
        let sec = content.substring(t, n<0? undefined: n);
        if (key === '#') {
            busVersion = Number(sec);
        }
        else if (key === '$') {
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
        ret += item['$'] + '\n';
        if (arrs === undefined) continue;
        for (let arr of arrs) {
            let arrRows = item[arr.name];
            if (arrRows !== undefined) {
                for (let ar of arrRows) {
                    ret += ar + '\n';
                }
            }
            ret += '\n';
        }
        // ret += '\n'; 
        // 多个bus array，不需要三个回车结束。自动取完，超过长度，自动结束。这样便于之后附加busQuery
    }

    return {body:ret, version:busVersion};
}
