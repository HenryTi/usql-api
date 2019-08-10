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
const core_1 = require("../core");
const finish_1 = require("./finish");
function queueOut(runner, net) {
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
                        // 上次尝试之后十分钟内不尝试，按次数，时间递增
                        if (now - update_time < tries * 10 * 60)
                            continue;
                    }
                    let finish;
                    if (!content) {
                        // 如果没有内容，直接进入failed
                        finish = finish_1.Finish.bad;
                    }
                    else {
                        try {
                            switch (action) {
                                default:
                                    yield processItem(runner, $unit, id, action, subject, content, update_time);
                                    break;
                                case 'email':
                                    yield email(runner, $unit, id, content);
                                    finish = finish_1.Finish.done;
                                    break;
                                case 'bus':
                                    yield bus(runner, net, $unit, id, subject, content);
                                    finish = finish_1.Finish.done;
                                    break;
                                case 'sheet':
                                    yield sheet(runner, content);
                                    finish = finish_1.Finish.done;
                                    break;
                            }
                        }
                        catch (err) {
                            if (tries < 5) {
                                finish = finish_1.Finish.retry; // retry
                            }
                            else {
                                finish = finish_1.Finish.bad; // fail
                            }
                            let errSubject = `error on ${action}:  ${subject}`;
                            let error = typeof (err) === 'object' ?
                                err.message : err;
                            yield runner.log($unit, errSubject, error);
                        }
                    }
                    if (finish !== undefined)
                        yield runner.unitCall(procMessageQueueSet, $unit, id, finish);
                }
            }
        }
        catch (err) {
            if (core_1.isDevelopment === true)
                console.log(err);
        }
    });
}
exports.queueOut = queueOut;
function processItem(runner, unit, id, action, subject, content, update_time) {
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
function jsonValues(content) {
    let json = {};
    let items = content.split('\n\t\n');
    for (let item of items) {
        let parts = item.split('\n');
        json[parts[0]] = parts[1];
    }
    return json;
}
function email(runner, unit, id, content) {
    return __awaiter(this, void 0, void 0, function* () {
        let values = jsonValues(content);
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
function bus(runner, net, unit, id, subject, content) {
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
        let { body, version } = toBusMessage(busSchema, face, content);
        let message = {
            unit: unit,
            type: 'bus',
            queueId: id,
            from: uqOwner + '/' + uq,
            busOwner: busOwner,
            bus: busName,
            face: face,
            version: version,
            body: body,
        };
        yield net.sendToUnitx(unit, message);
    });
}
function sheet(runner, content) {
    return __awaiter(this, void 0, void 0, function* () {
        let sheetQueueData = JSON.parse(content);
        let { id, sheet, state, action, unit, user, flow } = sheetQueueData;
        let result = yield runner.sheetAct(sheet, state, action, unit, user, id, flow);
    });
}
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
        return undefined;
    let faceSchema = busSchema[face];
    if (faceSchema === undefined) {
        debugger;
        throw 'something wrong';
    }
    let data = [];
    let p = 0;
    let part;
    let busVersion;
    for (;;) {
        let t = content.indexOf('\t', p);
        if (t < 0)
            break;
        let key = content.substring(p, t);
        ++t;
        let n = content.indexOf('\n', t);
        let sec = content.substring(t, n < 0 ? undefined : n);
        if (key === '#') {
            busVersion = Number(sec);
        }
        else if (key === '$') {
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
    return { body: ret, version: busVersion };
}
//# sourceMappingURL=queueOut.js.map