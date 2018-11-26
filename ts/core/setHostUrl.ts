import * as config from 'config';

const usqHost = 'localhost:3015';

export function urlSetUsqHost(url:string):string {
    return url.replace('://usqhost/', '://'+usqHost+'/');
}

const unitxHost = config.get<string>('unitxhost');
export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}

