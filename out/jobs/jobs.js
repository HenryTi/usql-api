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
const db_1 = require("../db");
const db_2 = require("../db/db");
const core_1 = require("../core");
/*
var nodemailer = require('nodemailer');
let emailOptions = config.get<any>('emailOptions');
const from = emailOptions.from; // 'noreply1@jkchemical.com';
const transporter = nodemailer.createTransport(emailOptions.options);
*/
class Jobs {
    constructor() {
        this.run = () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Jobs run at: ', new Date());
                let db = new db_2.Db(undefined);
                let uqs = yield db.uqDbs();
                for (let uqRow of uqs) {
                    let uq = uqRow.db;
                    yield this.processQueue(uq);
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setTimeout(this.run, 30 * 1000);
            }
        });
    }
    static start() {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            yield new Jobs().run();
        }), 5 * 1000);
    }
    processQueue(uq) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let runner = yield db_1.getRunner(uq);
                yield runner.init();
                let start = 0;
                let ret = yield runner.call('$message_queue_get', [start]);
                for (let row of ret) {
                    let { $unit, id, type, content, tries, update_time } = row;
                    if (tries > 0 && new Date().getTime() - update_time.getTime() < tries * 10 * 60 * 10000)
                        continue;
                    switch (type) {
                        default:
                            yield this.processItem(runner, $unit, id, type, content, tries, update_time);
                            break;
                        case 'email':
                            yield this.email(runner, $unit, id, type, content, tries, update_time);
                            break;
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    processItem(runner, unit, id, type, content, tries, update_time) {
        return __awaiter(this, void 0, void 0, function* () {
            let json = {};
            let items = content.split('\n\t\n');
            for (let item of items) {
                let parts = item.split('\n');
                json[parts[0]] = parts[1];
            }
            console.log('queue item: ', unit, id, type, json);
        });
    }
    values(content) {
        let json = {};
        let items = content.split('\n\t\n');
        for (let item of items) {
            let parts = item.split('\n');
            json[parts[0]] = parts[1];
        }
        return json;
    }
    email(runner, unit, id, type, content, tries, update_time) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = this.values(content);
            let { $isUser, $to, $cc, $bcc } = values;
            if (!$to)
                return;
            let schema = runner.getSchema(values.$templet);
            let { subjectSections, sections } = schema.call;
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
                yield core_1.centerApi.send({
                    isUser: $isUser === '1',
                    type: 'email',
                    subject: subject,
                    body: body,
                    to: $to,
                    cc: $cc,
                    bcc: $bcc
                });
                //await sendEmail(subject, body, to, cc, bcc);
                yield runner.call('$message_queue_set', [id, 1]); // success
            }
            catch (err) {
                if (tries < 5) {
                    yield runner.call('$message_queue_set', [id, 2]); // retry
                }
                else {
                    yield runner.call('$message_queue_set', [id, 3]); // fail
                }
            }
        });
    }
}
exports.Jobs = Jobs;
function stringFromSections(sections, values) {
    if (sections === undefined)
        return;
    let ret = [];
    let isValue = false;
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
//# sourceMappingURL=jobs.js.map