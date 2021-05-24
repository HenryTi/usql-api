"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueOut = void 0;
const tool_1 = require("../tool");
const core_1 = require("../core");
const finish_1 = require("./finish");
const tool_2 = require("../tool");
const unitx_1 = require("../core/unitx");
function queueOut(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let start = 0;
            let count = 0;
            for (; count < 200;) {
                let ret = yield runner.call('$message_queue_get', [start]);
                if (ret.length === 0)
                    break;
                let procMessageQueueSet = 'tv_$message_queue_set';
                for (let row of ret) {
                    // 以后修正，表中没有$unit，这时候应该runner里面包含$unit的值。在$unit表中，应该有唯一的unit值
                    let { $unit, id, to, action, subject, content, tries, update_time, now } = row;
                    tool_1.logger.log('queueOut 1: ', action, subject, content, update_time);
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
                                case 'app':
                                    yield app(runner, $unit, id, content);
                                    finish = finish_1.Finish.done;
                                    break;
                                case 'email':
                                    yield email(runner, $unit, id, content);
                                    finish = finish_1.Finish.done;
                                    break;
                                case 'bus':
                                    yield bus(runner, $unit, id, to, subject, content);
                                    finish = finish_1.Finish.done;
                                    break;
                                case 'sheet':
                                    yield sheet(runner, content);
                                    yield runner.log($unit, 'sheet-action', content);
                                    finish = finish_1.Finish.done;
                                    break;
                            }
                            ++count;
                        }
                        catch (err) {
                            if (tries < 5) {
                                finish = finish_1.Finish.retry; // retry
                            }
                            else {
                                finish = finish_1.Finish.bad; // fail
                            }
                            let errSubject = `error on ${action}:  ${subject}`;
                            /*
                            let error = typeof(err)==='object'?
                                err.message : err; */
                            let error = tool_2.getErrorString(err);
                            yield runner.log($unit, errSubject, error);
                        }
                    }
                    if (finish !== undefined)
                        yield runner.unitCall(procMessageQueueSet, $unit, id, finish);
                }
            }
        }
        catch (err) {
            yield runner.log(0, 'jobs queueOut loop', tool_2.getErrorString(err));
            if (core_1.env.isDevelopment === true)
                tool_1.logger.error(err);
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
        tool_1.logger.log('queue item: ', unit, id, action, subject, json);
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
function app(runner, unit, id, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield core_1.centerApi.send({
            type: 'app',
            unit: unit,
            body: content,
        });
    });
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
// bus参数，调用的时候，就是project
function bus(runner, unit, id, to, bus, content) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!unit && !to)
            return;
        let parts = bus.split('/');
        let busEntityName = parts[0];
        let face = parts[1];
        let schema = runner.getSchema(busEntityName);
        if (schema === undefined) {
            let err = `schema ${busEntityName} not exists`;
            tool_1.logger.error(err);
            debugger;
            throw err;
        }
        let { schema: busSchema, busOwner, busName } = schema.call;
        let { uqOwner, uq } = runner;
        let { body, version } = toBusMessage(busSchema, face, content);
        function buildMessage(u) {
            let message = {
                unit: u,
                type: 'bus',
                queueId: id,
                to,
                from: uqOwner + '/' + uq,
                busOwner: busOwner,
                bus: busName,
                face: face,
                version: version,
                body: body,
            };
            return message;
        }
        if (to > 0) {
            let unitXArr = yield unitx_1.getUserX(runner, to, bus, busOwner, busName, face);
            if (!unitXArr || unitXArr.length === 0)
                return;
            let promises = unitXArr.map(v => {
                let message = buildMessage(v);
                runner.net.sendToUnitx(v, message);
            });
            yield Promise.all(promises);
        }
        else {
            let message = buildMessage(unit);
            yield runner.net.sendToUnitx(unit, message);
        }
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
        throw 'toBusMessage something wrong';
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
        ret += item['$'] + '\n';
        if (arrs === undefined)
            continue;
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
    return { body: ret, version: busVersion };
}
//# sourceMappingURL=queueOut.js.map