import { Fetch } from "../fetch";
import { logger } from '../../tool';

export class UnitxApi extends Fetch {
	readonly tickCreate: number;
	constructor(url:string, tickCreate:number) {
		super(url);
		this.tickCreate = tickCreate;
	}

    async send(msg: any):Promise<number[]> {
        let ret:number[] = await this.post('', msg);
        return ret;
    }
    async fetchBus(unit:number, msgStart:number, faces:string):Promise<any[][]> {
		try {
			let ret = await this.post('fetch-bus', {
				unit: unit,
				msgStart: msgStart,
				faces: faces,
			});
			return ret;
		}
		catch (err) {
			logger.error('fetchBus error: url=%s, unit=%s', this.baseUrl, unit);
			logger.error('fetchBus error: ', err);
			return undefined;
		}
    }
}
