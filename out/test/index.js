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
const start_1 = require("../start");
const node_fetch_1 = require("node-fetch");
const $test = '$test';
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        //process.env.NODE_ENV = 'developement';
        //let runner = await testNet.getUnitxRunner();
        //await writeDataToBus(runner, 'test', 24, 'a', 101, 8, '{a:1}');
        yield start_1.init();
        let res = yield node_fetch_1.default('http://localhost:3015/uq/unitx-test/joint-read-bus', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                unit: 24,
                face: '百灵威系统工程部/WebUser/WebUser',
                queue: 434898000000023
            })
        });
        let ret = yield res.json();
        try {
            let s = null;
            let b = s.b;
        }
        catch (err) {
            let t = null;
        }
        /*
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