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
class Jobs {
    constructor() {
        this.run = () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Jobs started!');
                let db = new core_1.Db(undefined);
                let uqs = yield db.uqDbs();
                for (let uqRow of uqs) {
                    let { db: uqDb } = uqRow;
                    if (core_1.isDevelopment === true) {
                        yield db.setDebugJobs();
                    }
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
                console.error(err);
            }
            finally {
                setTimeout(this.run, runGap);
            }
        });
    }
    static start() {
        let startRun = () => __awaiter(this, void 0, void 0, function* () {
            let jobs = new Jobs;
            yield jobs.run();
        });
        if (core_1.isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs
            return;
            (function () {
                return __awaiter(this, void 0, void 0, function* () {
                    //logger.info('test', 't1', 't2');
                    console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
                    let db = new core_1.Db(undefined);
                    yield db.setDebugJobs();
                    setTimeout(startRun, waitForOtherStopJobs);
                });
            }());
        }
        else {
            setTimeout(startRun, firstRun);
        }
    }
}
exports.Jobs = Jobs;
//# sourceMappingURL=jobs.js.map