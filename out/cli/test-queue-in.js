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
const queueOut_1 = require("../jobs/queueOut");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('test-queue-out');
        // 停掉其它服务器操作消息队列
        //let db = Db.db(undefined);
        //await db.setDebugJobs();
        let dbName = 'order';
        let node_env = process.env.NODE_ENV;
        console.log('node_env=' + node_env + ', ' + 'db = ' + dbName);
        //let net = prodNet;
        let net = core_1.testNet;
        let runner = yield net.getRunner(dbName);
        let { buses } = runner;
        if (buses !== undefined) {
            let { outCount, faces } = buses;
            if (outCount > 0 || runner.hasSheet === true) {
                yield queueOut_1.queueOut(runner);
            }
            if (faces !== undefined) {
                //await pullBus(runner);
                //await queueIn(runner);
            }
        }
        // process.exit();
    });
})();
//# sourceMappingURL=test-queue-in.js.map