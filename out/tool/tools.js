"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorString = void 0;
function getErrorString(err) {
    if (err === null)
        return 'error=null';
    if (err === undefined)
        return 'error=undefined';
    if (typeof err === 'object') {
        let ret = 'error object - ';
        for (let key of Object.keys(err)) {
            ret += key + ': ' + err[key] + '; ';
        }
        return ret;
    }
    return err;
}
exports.getErrorString = getErrorString;
//# sourceMappingURL=tools.js.map