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
const pullEntities_1 = require("../jobs/pullEntities");
const start_1 = require("../start");
const $test = '$test';
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield start_1.init();
        let uqDb = 'salestask$test';
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
        let ret = yield runner.tableFromProc('customer', [24, undefined, 431]);
        yield pullEntities_1.pullEntities(runner);
        console.log(' ');
        console.log('===========================================================');
        console.log('=  End of test');
        console.log('===========================================================');
        process.exit();
    });
})();
/*
const keypress = async () => {
    (process.stdin as any).setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
      (process.stdin as any).setRawMode(false)
      resolve()
    }))
}
*/ 
//# sourceMappingURL=index.js.map