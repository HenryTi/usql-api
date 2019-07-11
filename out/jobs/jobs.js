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
const sendToUnitx_1 = require("../core/sendToUnitx");
const syncTuids_1 = require("./syncTuids");
const syncBus_1 = require("./syncBus");
let firstRun = db_2.isDevelopment === true ? 3000 : 30 * 1000;
let runGap = db_2.isDevelopment === true ? 15 * 1000 : 30 * 1000;
var Finish;
(function (Finish) {
    Finish[Finish["succeed"] = 1] = "succeed";
    Finish[Finish["retry"] = 2] = "retry";
    Finish[Finish["fail"] = 3] = "fail";
})(Finish || (Finish = {}));
class Jobs {
    constructor() {
        this.run = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (db_2.isDevelopment === true)
                    console.log('Jobs run at: ', new Date());
                let db = new db_2.Db(undefined);
                let uqs = yield db.uqDbs();
                for (let uqRow of uqs) {
                    let runner = yield db_1.getRunner(uqRow.db);
                    if (runner === undefined)
                        continue;
                    yield runner.init();
                    yield this.processQueue(runner);
                    yield syncBus_1.syncBus(runner);
                    yield syncTuids_1.syncTuids(runner);
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                setTimeout(this.run, runGap);
            }
        });
    }
    static start() {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            yield new Jobs().run();
        }), firstRun);
    }
    processQueue(runner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let start = 0;
                for (;;) {
                    let ret = yield runner.call('$message_queue_get', [start]);
                    if (ret.length === 0)
                        break;
                    let procMessageQueueSet = 'tv_$message_queue_set';
                    for (let row of ret) {
                        // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
                        let { $unit, id, action, subject, content, tries, update_time, now } = row;
                        start = id;
                        if (!$unit)
                            $unit = runner.uniqueUnit;
                        if (tries > 0) {
                            // 上次尝试之后十分钟内不尝试
                            if (now - update_time < tries * 10 * 60)
                                continue;
                        }
                        let finish;
                        if (!content) {
                            // 如果没有内容，直接进入failed
                            finish = Finish.fail;
                        }
                        else {
                            try {
                                switch (action) {
                                    default:
                                        yield this.processItem(runner, $unit, id, action, subject, content, update_time);
                                        break;
                                    case 'email':
                                        yield this.email(runner, $unit, id, content);
                                        finish = Finish.succeed;
                                        break;
                                    case 'bus':
                                        yield this.bus(runner, $unit, id, subject, content);
                                        finish = Finish.succeed;
                                        break;
                                }
                            }
                            catch (err) {
                                if (tries < 5) {
                                    finish = Finish.retry; // retry
                                }
                                else {
                                    finish = Finish.fail; // fail
                                }
                            }
                        }
                        if (finish !== undefined)
                            yield runner.unitCall(procMessageQueueSet, $unit, id, finish);
                    }
                }
            }
            catch (err) {
                debugger;
                if (db_2.isDevelopment === true)
                    console.log(err);
            }
        });
    }
    processItem(runner, unit, id, action, subject, content, update_time) {
        return __awaiter(this, void 0, void 0, function* () {
            let json = {};
            let items = content.split('\n\t\n');
            for (let item of items) {
                let parts = item.split('\n');
                json[parts[0]] = parts[1];
            }
            console.log('queue item: ', unit, id, action, subject, json);
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
    email(runner, unit, id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = this.values(content);
            let { $isUser, $to, $cc, $bcc, $templet } = values;
            if (!$to)
                return;
            let schema = runner.getSchema($templet);
            if (schema === undefined) {
                debugger;
                throw 'something wrong';
            }
            let { subjectSections, sections } = schema.call;
            let mailSubject = stringFromSections(subjectSections, values);
            let mailBody = stringFromSections(sections, values);
            yield core_1.centerApi.send({
                isUser: $isUser === '1',
                type: 'email',
                subject: mailSubject,
                body: mailBody,
                to: $to,
                cc: $cc,
                bcc: $bcc
            });
        });
    }
    bus(runner, unit, id, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!unit)
                return;
            let parts = subject.split('/');
            let busEntityName = parts[0];
            let face = parts[1];
            let schema = runner.getSchema(busEntityName);
            if (schema === undefined) {
                debugger;
                throw 'something wrong';
            }
            let { schema: busSchema, busOwner, busName } = schema.call;
            let { uqOwner, uq } = runner;
            let body = toBusMessage(busSchema, face, content);
            let message = {
                unit: unit,
                type: 'bus',
                queueId: id,
                from: uqOwner + '/' + uq,
                busOwner: busOwner,
                bus: busName,
                face: face,
                body: body,
            };
            yield sendToUnitx_1.sendToUnitx(unit, message);
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
function toBusMessage(busSchema, face, content) {
    if (!content)
        return '';
    let faceSchema = busSchema[face];
    if (faceSchema === undefined) {
        debugger;
        throw 'something wrong';
    }
    let data = [];
    let p = 0;
    let part;
    for (;;) {
        let t = content.indexOf('\t', p);
        if (t < 0)
            break;
        let key = content.substring(p, t);
        ++t;
        let n = content.indexOf('\n', t);
        let sec = content.substring(t, n < 0 ? undefined : n);
        if (key === '$') {
            if (part !== undefined)
                data.push(part);
            part = { $: [sec] };
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
        if (n < 0)
            break;
        p = n + 1;
    }
    if (part !== undefined)
        data.push(part);
    let { fields, arrs } = faceSchema;
    let ret = '';
    for (let item of data) {
        ret += item['$'];
        ret += '\n';
        if (arrs === undefined)
            continue;
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
//# sourceMappingURL=jobs.js.map