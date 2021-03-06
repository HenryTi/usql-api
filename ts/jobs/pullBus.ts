import { logger } from '../tool';
import { EntityRunner } from "../core";
import { getErrorString } from "../tool";

export async function pullBus(runner: EntityRunner) {
    try {
        let {buses, net} = runner;
        let {faces, coll, hasError} = buses;
        let pullBusItemCount = 0;
        while (hasError === false && pullBusItemCount < 200) {
			let unitMaxIds:{unit:number; maxId:number}[] = await getSyncUnits(runner);
            let msgCount = 0;
            for (let row of unitMaxIds) {
                let {unit, maxId} = row;
				if (maxId === null) maxId = 0;
				let ret = await net.pullBus(unit, maxId, faces);
				if (!ret) continue;

                let {maxMsgId, maxRows} = ret[0][0];
				let messages = ret[1];
				let {length: messagesLen} = messages;
				if (messagesLen > 0) {
					// 新版：bus读来，直接写入queue_in。然后在队列里面处理
					logger.log(`total ${messagesLen} arrived from unitx`);
					for (let row of messages) {
						let {to, face:faceUrl, id:msgId, body, version} = row;
						let face = coll[(faceUrl as string).toLowerCase()];
						if (face === undefined) continue;
						let {bus, faceName, version:runnerBusVersion} = face;
						try {
							if (runnerBusVersion !== version) {
								// 也就是说，bus消息的version，跟runner本身的bus version有可能不同
								// 不同需要做数据转换
								// 但是，现在先不处理
								// 2019-07-23
							}
							await runner.call('$queue_in_add', [unit, to, msgId, bus, faceName, body]);
							++pullBusItemCount;
						}
						catch (toQueueInErr) {
							hasError = buses.hasError = true;
							logger.error(toQueueInErr);
							await runner.log(unit, 'jobs pullBus loop to QueueInErr msgId='+msgId, getErrorString(toQueueInErr));
							break;
						}
						++msgCount;
					}
					if (hasError === true) break;
				}
                if (messagesLen < maxRows && maxId < maxMsgId) {
                    // 如果unit的所有mssage都处理完成了，则设为unit的最大msg，下次查找可以快些
                    await runner.call('$queue_in_add', [unit, undefined, maxMsgId, undefined, undefined, undefined]);
                    //await runner.busSyncMax(unit, maxMsgId);
                }
            }
            // 如果没有处理任何消息，则退出，等待下一个循环
            if (msgCount === 0) break;
        }
    }
    catch (err) {
        logger.error(err);
        await runner.log(0, 'jobs pullBus loop error: ', getErrorString(err));
    }
}

async function getSyncUnits(runner: EntityRunner): Promise<any[]> {
	let syncUnits = await runner.call('$sync_units', []);
	return syncUnits;
}
