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

    async uqUrl(unit:number, uq:number):Promise<any> {
        return await this.get('open/uq-url', {unit:unit, uq:uq});
    }

    async urlFromUq(unit:number, uqFullName:string):Promise<any> {
        return await this.get('open/url-from-uq', {unit:unit, uq:uqFullName});
    }

    async uqDb(name:string):Promise<any> {
        return await this.get('open/uqdb', {name:name});
    }

    async pushTo(msg:any):Promise<void> {
        return await this.post('push', msg);
    }

    async userIdFromName(user:string):Promise<number> {
        return await this.get('open/user-id-from-name', {user: user});
    }

    /*
    // \t 分隔的ids组
    async users(ids:string):Promise<any> {
        return await this.post('open/users', {ids: ids});
    }*/

    async send(param: SendParameter):Promise<void> {
        return await this.post('send', param);
    }
}

interface SendParameter {
    isUser:boolean;
    type: string;
    subject:string;
    body:string;
    to:string;
    cc:string; 
    bcc:string
};


export const centerApi = new CenterApi();
