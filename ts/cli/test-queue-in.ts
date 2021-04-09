import { prodNet, testNet, Db } from "../core";
import { queueIn } from "../jobs/queueIn";
import { queueOut } from "../jobs/queueOut";

(async function() {
	console.log('test-queue-out');

	// 停掉其它服务器操作消息队列
	//let db = Db.db(undefined);
	//await db.setDebugJobs();

	let dbName = 'order';
	let node_env = process.env.NODE_ENV;
	console.log('node_env=' + node_env + ', ' + 'db = ' + dbName);
	//let net = prodNet;
	let net = testNet;
	let runner = await net.getRunner(dbName);
	
	let {buses} = runner;
	if (buses !== undefined) {
		let {outCount, faces} = buses;
		if (outCount > 0 || runner.hasSheet === true) {
			await queueOut(runner);
		}
		if (faces !== undefined) {
			//await pullBus(runner);
			//await queueIn(runner);
		}
	}

	
	// process.exit();
})();
