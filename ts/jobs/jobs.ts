import * as _ from 'lodash';
import { Net, Db, prodNet, testNet, env } from '../core';
import { pullEntities } from './pullEntities';
import { pullBus } from './pullBus';
import { queueIn } from './queueIn';
import { queueOut } from './queueOut';

const firstRun: number = env.isDevelopment === true? 3000 : 30*1000;
const runGap: number = env.isDevelopment === true? 15*1000 : 30*1000;
const waitForOtherStopJobs = 1*1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';

function sleep(ms: number):Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

let loopWait: boolean = true;
export function jobsLoopNoWait() {
    loopWait = false;
}

export async function startJobsLoop(): Promise<void> {
	let db = Db.db(undefined);
    if (env.isDevelopment === true) {
		// 只有在开发状态下，才可以屏蔽jobs
		//console.log('jobs loop: developing, no loop!');
		//return;
		if (env.isDevdo === true) return;
        console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
		await db.setDebugJobs();
		console.log('========= set debugging jobs =========');
        await sleep(waitForOtherStopJobs);
    }
    else {
        await sleep(firstRun);
    }

    console.log('Jobs loop started!');
    for (;;) {
        console.log('=');
        console.info('========= Jobs loop at %s =========', new Date().toLocaleString());
        try {
			let uqs = await db.uqDbs();
			if (uqs.length === 0) {
				console.error('debugging_jobs=yes, stop jobs loop');
			}
			else for (let uqRow of uqs) {
                let {db:uqDb} = uqRow;
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
				// 2020-7-1：我太蠢了。居然带着这一句发布了 ？！！！
				// if (dbName !== 'bi') continue;

                if (env.isDevelopment === true) {
					// if (dbName === 'pointshop') debugger;
					await db.setDebugJobs();
					console.info('========= set debugging jobs =========');
                }
                console.info('====== job loop for ' + uqDb + '======');

                let runner = await net.getRunner(dbName);
				if (runner === undefined) continue;
				let {buses} = runner;
                if (buses !== undefined) {
					let {outCount, faces} = buses;
                    if (outCount > 0 || runner.hasSheet === true) {
						console.info(`==== in loop ${uqDb}: queueOut out bus number=${outCount} ====`);
                        await queueOut(runner);
                    }
                    if (faces !== undefined) {
						console.info(`==== in loop ${uqDb}: pullBus faces: ${faces} ====`);
                        await pullBus(runner);
						console.info(`==== in loop ${uqDb}: queueIn faces: ${faces} ====`);
                        await queueIn(runner);
                    }
                }
				console.info(`==== in loop ${uqDb}: pullEntities ====`);
                await pullEntities(runner);
            }
        }
        catch (err) {
            console.error('jobs loop error!!!!');
            console.error(err);
            let errText:string = '';
            if (err === null) {
                errText = 'null';
            }
            else {
                switch (typeof err) {
                    default: errText = err; break;
                    case 'string': errText = err; break;
                    case 'undefined': errText = 'undefined'; break;
                    case 'object': errText = 'object: ' + err.messsage; break;
                }
            }
            await db.log(0, '$jobs', '$jobs loop error', errText);
        }
        finally {
            if (loopWait === true) {
				try {
					// 在测试服务器上，jobs loop经常会断掉出来。看来只有这一种可能了。
					// 执行这个sleep的时候，出现问题，从而跳出loop
					await sleep(runGap);
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
    }
}
