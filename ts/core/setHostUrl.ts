import * as config from 'config';

const uqHost = 'localhost:3015';
//const unitxHost = config.get<string>('unitxhost');

export function urlSetUqHost():string {
    //return url.replace('://uqhost/', '://'+uqHost+'/');
    return 'http://' + uqHost + '/';
}
/*
export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}
*/
