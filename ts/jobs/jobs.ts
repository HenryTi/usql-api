import * as _ from 'lodash';
import { Runner, getRunner } from "../db";
import { Db } from "../db/db";
import { centerApi } from "../core";

/*
var nodemailer = require('nodemailer');
let emailOptions = config.get<any>('emailOptions');
const from = emailOptions.from; // 'noreply1@jkchemical.com';
const transporter = nodemailer.createTransport(emailOptions.options);
*/

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
            let ret = await runner.call('$message_queue_get', [start]);
            for (let row of ret) {
                let {$unit, id, type, content, tries, update_time} = row;
                if (tries > 0 && new Date().getTime() - update_time.getTime() < tries * 10 * 60 * 10000) continue;
                switch (type) {
                    default:
                        await this.processItem(runner, $unit, id, type, content, tries, update_time);
                        break;
                    case 'email':
                        await this.email(runner, $unit, id, type, content, tries, update_time);
                        break;
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    private async processItem(runner:Runner, unit:number, id:number, type:string, content:string, tries:number, update_time:Date): Promise<void> {
        let json:any = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        console.log('queue item: ', unit, id, type, json);
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

    private async email(runner:Runner, unit:number, id:number, type:string, content:string, tries:number, update_time:Date): Promise<void> {
        let values = this.values(content);
        let {$isUser, $to, $cc, $bcc} = values;
        if (!$to) return;
        let schema = runner.getSchema(values.$templet);
        let {subjectSections, sections} = schema.call;
        let subject = stringFromSections(subjectSections, values);
        let body = stringFromSections(sections, values);
        /*
        let to: string = $to, cc: string = $cc, bcc:string = $bcc;
        if ($isUser === '1') {
            let toIds = $to.split(',');
            let ids:string[] = [...toIds];
            let ccIds:string[], bccIds:string[];
            if ($cc) {
                ccIds = $cc.split(',');
                ids.push(...ccIds);
            }
            if ($bcc) {
                bccIds = $bcc.split(',');
                ids.push(...bccIds);
            }
            let users = await centerApi.users(_.uniq(ids).join(','));
            let userColl:any = {};
            for (let user of users) {
                let {id} = user;
                userColl[String(id)] = user;
            }
            let emails:string[] = [];
            for (let id of ids) emails.push(userColl[id].email);
            to = emails.join(',');
            if (ccIds) {
                emails = [];
                for (let id of ccIds) emails.push(userColl[id].email);
                cc = emails.join(',');
            }
            if (bccIds) {
                emails = [];
                for (let id of bccIds) emails.push(userColl[id].email);
                bcc = emails.join(',');
            }
        }
        console.log(subject, body);
        */
        try {
            await centerApi.send({
                isUser: $isUser === '1',
                type: 'email',
                subject: subject,
                body: body,
                to: $to,
                cc: $cc,
                bcc: $bcc
            });
            //await sendEmail(subject, body, to, cc, bcc);
            await runner.call('$message_queue_set', [id, 1]); // success
        }
        catch (err) {
            if (tries < 5) {
                await runner.call('$message_queue_set', [id, 2]); // retry
            }
            else {
                await runner.call('$message_queue_set', [id, 3]); // fail
            }
        }
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
/*
async function sendEmail(subject:string, body:string, to:string, cc:string, bcc:string): Promise<void> {
    return new Promise((resolve, reject) => {
        // send mail with defined transport object
        let mailOptions = {
            from: from,
            to: to,
            cc: cc,
            bcc: bcc,
            subject: subject,
            text: body,
            html: body,
        };
        transporter.sendMail(mailOptions, function(error:any, info:any){
            if(error){
                return reject(error);
            }
            console.log('Message sent: ' + info.response);
            resolve();
        });
    });
}
*/
