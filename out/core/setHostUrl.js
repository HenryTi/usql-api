"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const uqHost = 'localhost:3015';
const unitxHost = config.get('unitxhost');
function urlSetUqHost(url) {
    return url.replace('://uqhost/', '://' + uqHost + '/');
}
exports.urlSetUqHost = urlSetUqHost;
function urlSetUnitxHost(url) {
    return url.replace('://unitxhost/', '://' + unitxHost + '/');
}
exports.urlSetUnitxHost = urlSetUnitxHost;
//# sourceMappingURL=setHostUrl.js.map