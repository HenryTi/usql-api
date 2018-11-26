"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const usqHost = 'localhost:3015';
function urlSetUsqHost(url) {
    return url.replace('://usqhost/', '://' + usqHost + '/');
}
exports.urlSetUsqHost = urlSetUsqHost;
const unitxHost = config.get('unitxhost');
function urlSetUnitxHost(url) {
    return url.replace('://unitxhost/', '://' + unitxHost + '/');
}
exports.urlSetUnitxHost = urlSetUnitxHost;
//# sourceMappingURL=setHostUrl.js.map