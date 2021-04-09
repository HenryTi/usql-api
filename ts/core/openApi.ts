//import fetch from "node-fetch";
import { Fetch } from ".";

interface QueueModify {
    queue: {id:number, entity:string, key:string}[];
    queueMax: number;
}

export class OpenApi extends Fetch {
    async fromEntity(unit: number|string, entity:string, key: string):Promise<any> {
        let ret = await this.post('open/from-entity', {
            unit: unit,
            entity: entity,
            key: key,
        });
        return ret;
    }
    async queueModify(unit:number|string, start:number, page:number, entities:string):Promise<QueueModify> {
        if (start === undefined || start === null) start = 0;
        let ret = await this.post('open/queue-modify', {
            unit: unit,
            start: start,
            page: page,
            entities: entities,
        });
        return ret;
    }
    async busQuery(unit:number, busOwner:string, busName:string, face:string, params: any[]):Promise<any[][]> {
        let ret = await this.post('open/bus-query', {
            unit:unit, 
            busOwner:busOwner, 
            busName:busName, 
            face:face, 
            params: params
        });
        return ret;
    }
}
