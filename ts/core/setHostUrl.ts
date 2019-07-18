import * as config from 'config';

const uqHost = 'localhost:3015';
const unitxHost = config.get<string>('unitxhost');

export function urlSetUqHost(url:string):string {
    return url.replace('://uqhost/', '://'+uqHost+'/');
}

export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}

