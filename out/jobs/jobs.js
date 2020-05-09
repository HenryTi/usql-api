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
const core_1 = require("../core");
const pullEntities_1 = require("./pullEntities");
const pullBus_1 = require("./pullBus");
const queueIn_1 = require("./queueIn");
const queueOut_1 = require("./queueOut");
const firstRun = core_1.isDevelopment === true ? 3000 : 30 * 1000;
const runGap = core_1.isDevelopment === true ? 15 * 1000 : 30 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
let loopWait = true;
function jobsLoopNoWait() {
    loopWait = false;
}
exports.jobsLoopNoWait = jobsLoopNoWait;
function startJobsLoop() {
    return __awaiter(this, void 0, void 0, function* () {
        let db = core_1.Db.db(undefined);
        if (core_1.isDevelopment === true || core_1.isDevdo === true) {
            // 只有在开发状态下，才可以屏蔽jobs
            //console.log('jobs loop: developing, no loop!');
            //return;
            console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
            yield db.setDebugJobs();
            yield sleep(waitForOtherStopJobs);
        }
        else {
            yield sleep(firstRun);
        }
        console.log('Jobs loop started!');
        for (;;) {
            console.log();
            console.error('===================== jobs loop once ===================');
            try {
                let uqs = yield db.uqDbs();
                for (let uqRow of uqs) {
                    let { db: uqDb } = uqRow;
                    let net;
                    let dbName;
                    ;
                    if (uqDb.endsWith($test) === true) {
                        dbName = uqDb.substr(0, uqDb.length - $test.length);
                        net = core_1.testNet;
                    }
                    else {
                        dbName = uqDb;
                        net = core_1.prodNet;
                    }
                    if (core_1.isDevelopment === true) {
                        // if (dbName !== 'rms') continue;
                        yield db.setDebugJobs();
                    }
                    console.info('====== job loop for ' + uqDb + '======');
                    let runner = yield net.getRunner(dbName);
                    if (runner === undefined)
                        continue;
                    let { buses } = runner;
                    if (buses !== undefined) {
                        let { outCount, faces } = buses;
                        if (outCount > 0 || runner.hasSheet === true) {
                            yield queueOut_1.queueOut(runner);
                        }
                        if (faces !== undefined) {
                            yield pullBus_1.pullBus(runner);
                            yield queueIn_1.queueIn(runner);
                        }
                    }
                    yield pullEntities_1.pullEntities(runner);
                }
            }
            catch (err) {
                console.error('jobs loop error!!!!');
                console.error(err);
                let errText = '';
                if (err === null) {
                    errText = 'null';
                }
                else {
                    switch (typeof err) {
                        default:
                            errText = err;
                            break;
                        case 'string':
                            errText = err;
                            break;
                        case 'undefined':
                            errText = 'undefined';
                            break;
                        case 'object':
                            errText = 'object: ' + err.messsage;
                            break;
                    }
                }
                yield db.log(0, '$jobs', '$jobs loop error', errText);
            }
            finally {
                if (loopWait === true) {
                    yield sleep(runGap);
                }
                else {
                    loopWait = true;
                }
            }
        }
    });
}
exports.startJobsLoop = startJobsLoop;
//# sourceMappingURL=jobs.js.map