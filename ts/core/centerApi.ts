import * as config from 'config';
import {Fetch} from './fetch';

const centerHost = config.get<string>('centerhost');
const centerUrl = urlSetCenterHost(config.get<string>('center'));

export function urlSetCenterHost(url:string):string {
    return url.replace('://centerhost/', '://'+centerHost+'/');
}

class CenterApi extends Fetch {
    constructor() {
        super(centerUrl);
    }

    async busSchema(owner:string, bus:string):Promise<string> {
        let ret = await this.get('open/bus', {owner: owner, bus: bus});
        return ret.schema;
    }

    async serviceBus(serviceUID:string, serviceBuses:string):Promise<void> {
        await this.post('open/save-service-bus', {
            service: serviceUID,
            bus: serviceBuses,
        });
    }

    async unitx(unit:number):Promise<any> {
        return await this.get('open/unitx', {unit:unit});
    }

    async usqUrl(unit:number, usq:number):Promise<any> {
        return await this.get('open/usq-url', {unit:unit, usq:usq});
    }

    async urlFromUsq(unit:number, usqFullName:string):Promise<any> {
        return await this.get('open/url-from-usq', {unit:unit, usq:usqFullName});
    }

    async usqlDb(name:string):Promise<any> {
        return await this.get('open/usqldb', {name:name});
    }

    async pushTo(msg:any):Promise<void> {
        return await this.post('push', msg);
    }

    async unitxBuses(unit:number, busOwner:string, bus:string, face:string):Promise<any[]> {
        return await this.get('open/unitx-buses', {unit:unit, busOwner:busOwner, bus:bus, face:face});
    }
}

export const centerApi = new CenterApi();
