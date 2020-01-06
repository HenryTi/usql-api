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
const finish_1 = require("./finish");
const tool_1 = require("../tool");
function queueIn(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let start = 0;
        let { buses } = runner;
        let { hasError } = buses;
        let count = 0;
        while (hasError === false && count < 200) {
            try {
                let queueInArr = yield runner.call('$queue_in_get', [start]);
                if (queueInArr.length === 0)
                    break;
                for (let queueIn of queueInArr) {
                    ++count;
                    let { bus, faceName, id, unit, data, tries, update_time, now } = queueIn;
                    start = id;
                    if (!unit)
                        unit = runner.uniqueUnit;
                    if (tries > 0) {
                        // 上次尝试之后十分钟内不尝试
                        if (now - update_time < tries * 10 * 60)
                            continue;
                    }
                    let finish;
                    try {
                        yield runner.bus(bus, faceName, unit, id, data);
                        finish = finish_1.Finish.done;
                    }
                    catch (err) {
                        if (tries < 5) {
                            finish = finish_1.Finish.retry; // retry
                        }
                        else {
                            finish = finish_1.Finish.bad; // fail
                        }
                        let errSubject = `error queue_in on ${bus}/${faceName}:${id}`;
                        let error = errorText(err);
                        yield runner.log(unit, errSubject, error);
                    }
                    if (finish !== finish_1.Finish.done) {
                        // 操作错误，retry++ or bad
                        yield runner.call('$queue_in_set', [id, finish]);
                    }
                }
            }
            catch (err) {
                hasError = buses.hasError = true;
                console.error(err);
                yield runner.log(0, 'jobs queueIn loop at ' + start, tool_1.getErrorString(err));
                break;
            }
        }
    });
}
exports.queueIn = queueIn;
function errorText(err) {
    let errType = typeof err;
    switch (errType) {
        default: return errType + ': ' + err;
        case 'undefined': return 'undefined';
        case 'string': return err;
        case 'object': break;
    }
    if (err === null)
        return 'null';
    let ret = '';
    for (let i in err) {
        ret += i + ':' + err[i];
    }
    return ret;
}
//# sourceMappingURL=queueIn.js.map