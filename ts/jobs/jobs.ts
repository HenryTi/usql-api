import * as _ from 'lodash';
import { Net, Db, isDevelopment, prodNet, testNet, Bench } from '../core';
import { pullEntities } from './pullEntities';
import { pullBus } from './pullBus';
import { queueIn } from './queueIn';
import { queueOut } from './queueOut';

const firstRun: number = isDevelopment === true? 3000 : 30*1000;
const runGap: number = isDevelopment === true? 15*1000 : 30*1000;
const waitForOtherStopJobs = 1*1000; // 等1分钟，等其它服务器uq-api停止jobs
const $test = '$test';

export class Jobs {
    static start(): void {
        let startRun = async () => {
            let jobs = new Jobs;
            await jobs.run();
        }
        if (isDevelopment === true) {
            // 只有在开发状态下，才可以屏蔽jobs
            //return;
            (async function() {
                //logger.info('test', 't1', 't2');
                console.log(`It's ${new Date().toLocaleTimeString()}, waiting 1 minutes for other jobs to stop.`);
                let db = new Db(undefined);
                await db.setDebugJobs();
                setTimeout(startRun, waitForOtherStopJobs);
            }());
        }
        else {
            setTimeout(startRun, firstRun);
        }
    }

    private run = async (): Promise<void> => {
        let logger = new Bench();
        try {
            console.log('Jobs started!');
            let db = new Db(undefined);
            logger.start('db.uqDbs()');
            let uqs = await db.uqDbs();
            logger.log();
            for (let uqRow of uqs) {
                let {db:uqDb} = uqRow;
                if (isDevelopment === true) {
                    await db.setDebugJobs();
                }
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
                if (runner === undefined) continue;
                let {buses} = runner;
                if (buses !== undefined) {
                    let {outCount, faces} = buses;
                    if (outCount > 0) {
                        await queueOut(runner);
                    }
                    if (faces !== undefined) {
                        await pullBus(runner);
                        await queueIn(runner);
                    }
                }
                await pullEntities(runner);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setTimeout(this.run, runGap);
        }
    }
}
