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
exports.startJobsLoop = void 0;
const core_1 = require("../core");
const pullEntities_1 = require("./pullEntities");
const pullBus_1 = require("./pullBus");
const queueIn_1 = require("./queueIn");
const queueOut_1 = require("./queueOut");
const firstRun = core_1.env.isDevelopment === true ? 3000 : 30 * 1000;
const runGap = core_1.env.isDevelopment === true ? 15 * 1000 : 30 * 1000;
const waitForOtherStopJobs = 1 * 1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';
function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
let loopWait = true;
/*
export function jobsLoopNoWait() {
    loopWait = false;
}
*/
function startJobsLoop() {
    return __awaiter(this, void 0, void 0, function* () {
        let $uqDb = core_1.Db.db(core_1.consts.$uq);
        if (core_1.env.isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs
            //console.log('jobs loop: developing, no loop!');
            //return;
            if (core_1.env.isDevdo === true)
                return;
            console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
            yield $uqDb.setDebugJobs();
            console.log('========= set debugging jobs =========');
            yield sleep(waitForOtherStopJobs);
        }
        else {
            yield sleep(firstRun);
        }
        console.log('\n');
        console.log('\n');
        console.error('====== Jobs loop started! ======');
        for (;;) {
            console.log('\n');
            console.info(`====== ${process.env.NODE_ENV} one loop at ${new Date().toLocaleString()} ======`);
            try {
                let uqs = yield $uqDb.uqDbs();
                if (uqs.length === 0) {
                    console.error('debugging_jobs=yes, stop jobs loop');
                }
                else
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
                        // 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
                        // if (dbName !== 'bi') continue;
                        if (core_1.env.isDevelopment === true) {
                            // if (dbName === 'pointshop') debugger;
                            yield $uqDb.setDebugJobs();
                            console.info('========= set debugging jobs =========');
                        }
                        console.info('====== loop for ' + uqDb + '======');
                        let runner = yield net.getRunner(dbName);
                        if (runner === undefined)
                            continue;
                        let { buses } = runner;
                        if (buses !== undefined) {
                            let { outCount, faces } = buses;
                            if (outCount > 0 || runner.hasSheet === true) {
                                console.info(`==== in loop ${uqDb}: queueOut out bus number=${outCount} ====`);
                                yield queueOut_1.queueOut(runner);
                            }
                            if (faces !== undefined) {
                                console.info(`==== in loop ${uqDb}: pullBus faces: ${faces} ====`);
                                yield pullBus_1.pullBus(runner);
                                console.info(`==== in loop ${uqDb}: queueIn faces: ${faces} ====`);
                                yield queueIn_1.queueIn(runner);
                            }
                        }
                        console.info(`==== in loop ${uqDb}: pullEntities ====`);
                        yield pullEntities_1.pullEntities(runner);
                        console.info(`###### end loop ${uqDb} ######`);
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
                yield $uqDb.log(0, '$jobs', '$jobs loop error', errText);
            }
            finally {
                if (loopWait === true) {
                    try {
                        // 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
                        // 执行这个sleep的时候，出现问题，从而跳出loop
                        yield sleep(runGap);
                    }
                    catch (errSleep) {
                        console.error('=========================');
                        console.error('===== sleep error =======');
                        console.error(errSleep);
                        console.error('=========================');
                    }
                }
                else {
                    loopWait = true;
                }
            }
            console.info(`###### one loop end at ${new Date().toLocaleString()} ######`);
        }
    });
}
exports.startJobsLoop = startJobsLoop;
//# sourceMappingURL=jobs.js.map