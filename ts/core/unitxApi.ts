import { Fetch } from "./fetch";

export class UnitxApi extends Fetch {
    async send(msg: any):Promise<number[]> {
        let ret:number[] = await this.post('unitx', msg);
        return ret;
    }
}