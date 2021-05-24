import fetch, {Headers} from 'node-fetch';
import { logger } from '../tool';

export abstract class Fetch {
    protected readonly baseUrl:string;
    constructor(baseUrl:string) {
        this.baseUrl = baseUrl;
    }
    get url():string {return this.baseUrl};
    protected async get(url: string, params: any = undefined): Promise<any> {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
					if (v === undefined) continue;
					if (v === null) continue;
                    url += c + k + '=' + encodeURIComponent(params[k]);
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
        logger.log('innerFetch ' + method + '  ' + this.baseUrl + url);
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
            logger.error(this.baseUrl + url, res.statusText, res.status);
            throw {
                error: res.statusText,
                code: res.status,
            };
            //logger.log('statusCode=', response.statusCode);
            //logger.log('statusMessage=', response.statusMessage);
        }
        let json = await res.json();
        if (json.error !== undefined) {
            throw json.error;
        }
        if (json.ok === true) {
            return json.res;
        }
        return json;
    }
}

