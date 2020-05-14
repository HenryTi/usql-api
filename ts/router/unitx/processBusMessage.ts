import { EntityRunner, BusMessage /*, consts, busQueuehour, busQueueSeedFromHour, busQueueHourFromSeed*/ } from '../../core';

//let lastHour: number = 0;

export async function writeDataToBus(runner:EntityRunner, face:string, unit:number, from:string, fromQueueId:number, version:number, body:string) {
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
	for (let i=0; i<10; i++) {
		console.error('=========================');
	}
	console.log('writebusqueue', face, from, fromQueueId, body);
    await runner.actionDirect('writebusqueue', unit, undefined, face, from, fromQueueId, version, body);
}

export async function processBusMessage(unitxRunner:EntityRunner, msg:BusMessage):Promise<void> {
    // 处理 bus message，发送到相应的uq服务器
    let {unit, body, from, queueId, busOwner, bus, face, version} = msg;
    let faceUrl = busOwner + '/' + bus + '/' + face;
    await writeDataToBus(unitxRunner, faceUrl, unit, from, queueId, version, body);
}
