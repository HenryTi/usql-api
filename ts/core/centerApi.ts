import fetch, {Headers} from 'node-fetch';
import * as config from 'config';

const centerUrl = config.get<string>('center');

abstract class Fetch {
    private baseUrl:string;
    constructor(baseUrl:string) {
        this.baseUrl = baseUrl;
    }
    protected async get(url: string, params: any = undefined): Promise<any> {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
                    if (v === undefined) continue;
                    url += c + k + '=' + params[k];
                    c = '&';
                }
            }
        }
        return await this.innerFetch(url, 'GET');
    }

    protected async post(url: string, params: any): Promise<any> {
        return await this.innerFetch(url, 'POST', params);
    }

    private async innerFetch(url: string, method:string, body?:any): Promise<any> {
        var headers = new Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        let res = await fetch(
            this.baseUrl + url, 
            {
                headers: {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json',
                    //"Authorization": 'this.apiToken',
                    //"Access-Control-Allow-Origin": '*'
                },
                method: method,
                body: JSON.stringify(body),
            }
        );
        if (res.status !== 200) {
            throw {
                error: res.statusText,
                code: res.status,
            };
            //console.log('statusCode=', response.statusCode);
            //console.log('statusMessage=', response.statusMessage);
        }
        let json = await res.json();
        if (json.ok !== true) {
            throw json.error;
        }
        return json.res;
    }
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

export class UnitxApi extends Fetch {
    async send(jobData: {$unit:number, bus:string, face:string, data:any}):Promise<void> {
        await this.post('unitx', jobData);
    }
}
