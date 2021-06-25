import { EntityRunner } from "../core";
import { logger } from "../tool";

export async function execQueueAct(runner:EntityRunner):Promise<void> {
	if (runner.execQueueActError === true) return;
	try {
		for (let i=0; i<20; i++) {
			let ret:any[] = await runner.call('$exec_queue_act', []);
			if (!ret) break;
			if (ret.length === 0) break;
			let row = ret[0];
			if (Array.isArray(row) === true) {
				if (row.length === 0) break;
				row = row[0];
			}
			if (!row) break;
		}
	}
	catch (err) {
		logger.error(`execQueueAct: `, err);
		runner.execQueueActError = true;
	}
}
