import * as config from 'config';

const uqHost = 'localhost:3015';

export function urlSetUqHost(url:string):string {
    return url.replace('://uqhost/', '://'+uqHost+'/');
}

const unitxHost = config.get<string>('unitxhost');
export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}

