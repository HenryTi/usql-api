import { Net, testNet, prodNet } from "../core";
import { pullEntities } from "../jobs/pullEntities";
import { init } from "../start";
import { writeDataToBus } from "../router/unitx/processBusMessage";
import fetch from "node-fetch";

const $test = '$test';

(async function() {
    //process.env.NODE_ENV = 'developement';
    //let runner = await testNet.getUnitxRunner();
    //await writeDataToBus(runner, 'test', 24, 'a', 101, 8, '{a:1}');

    await init();

    let res = await fetch('http://localhost:3015/uq/unitx-test/joint-read-bus', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            unit:24,
            face: '百灵威系统工程部/WebUser/WebUser', 
            queue: 434898000000023
        })
    });
    let ret = await res.json();
    let s = null;

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