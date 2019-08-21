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
const processBusMessage_1 = require("../router/unitx/processBusMessage");
const $test = '$test';
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        process.env.NODE_ENV = 'developement';
        let runner = yield core_1.testNet.getUnitxRunner();
        yield processBusMessage_1.writeDataToBus(runner, 'test', 24, 'a', 101, 8, '{a:1}');
        /*
        await init();
    
        let uqDb = 'salestask$test';
        let net:Net;
        let dbName:string;;
        if (uqDb.endsWith($test) === true) {
            dbName = uqDb.substr(0, uqDb.length - $test.length);
            net = testNet;
        }
        else {
            dbName = uqDb;
            net = prodNet;
        }
    
        let runner = await net.getRunner(dbName);
    
        let ret = await runner.tableFromProc('customer', [24, undefined, 431]);
    
        await pullEntities(runner);
        console.log(' ');
        console.log('===========================================================');
        console.log('=  End of test');
        console.log('===========================================================');
        */
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