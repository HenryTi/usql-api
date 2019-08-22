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
const finish_1 = require("./finish");
function queueIn(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let start = 0;
        let { buses } = runner;
        let { hasError } = buses;
        while (hasError === false) {
            try {
                let queueInArr = yield runner.call('$queue_in_get', [start]);
                if (queueInArr.length === 0)
                    break;
                for (let queueIn of queueInArr) {
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
                        let error = typeof (err) === 'object' ?
                            err.message + '\n' + err.stack : err;
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
                break;
            }
        }
    });
}
exports.queueIn = queueIn;
//# sourceMappingURL=queueIn.js.map