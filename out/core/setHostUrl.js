"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlSetUqHost = void 0;
const uqHost = 'localhost:3015';
//const unitxHost = config.get<string>('unitxhost');
function urlSetUqHost() {
    //return url.replace('://uqhost/', '://'+uqHost+'/');
    return 'http://' + uqHost + '/';
}
exports.urlSetUqHost = urlSetUqHost;
/*
export function urlSetUnitxHost(url:string):string {
    return url.replace('://unitxhost/', '://'+unitxHost+'/');
}
*/
//# sourceMappingURL=setHostUrl.js.map