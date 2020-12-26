import { Fetch } from "./fetch";

export class UnitxApi extends Fetch {
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
			console.error('UnitxApi.fetchBus', err);
		}
    }
}
