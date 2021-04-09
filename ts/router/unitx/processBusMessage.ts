import { EntityRunner, BusMessage /*, consts, busQueuehour, busQueueSeedFromHour, busQueueHourFromSeed*/ } from '../../core';

//let lastHour: number = 0;

export async function writeDataToBus(runner:EntityRunner, face:string, unit:number, to:number, from:string, fromQueueId:number, version:number, body:string):Promise<number> {
	/*
    let hour = busQueuehour();
    if (hour > lastHour) {
        let seed = busQueueSeedFromHour(hour);
        let seedRet = await runner.call('$get_table_seed', ['busqueue']);
        let s = seedRet[0].seed;
        if (!s) s = 1;
        if (seed > s) {
            await runner.call('$set_bus_queue_seed', ['busqueue', seed]);
        }
        lastHour = hour;
    }
	*/
	let ret = await runner.actionDirect('writebusqueue', unit, undefined, face, to, from, fromQueueId, version, body);
	if (ret && ret.length > 0) {
		return ret[0]['queueid'];
	}
}

export async function processBusMessage(unitxRunner:EntityRunner, msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的uq服务器
    let {unit, body, to, from, queueId, busOwner, bus, face, version} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
	let ret = await writeDataToBus(unitxRunner, faceUrl, unit, to, from, queueId, version, body);
	if (ret < 0) {
		console.error('writeDataToBus message duplicated!', msg, -ret);
	}
}
