"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tab = '\t';
const ln = '\n';
function packParam(schema, data) {
    let ret = [];
    if (schema === undefined || data === undefined)
        return;
    let fields = schema.fields;
    if (fields !== undefined)
        packRow(ret, schema.fields, data);
    let arrs = schema['arrs'];
    if (arrs !== undefined) {
        for (let arr of arrs) {
            packArr(ret, arr.fields, data[arr.name]);
        }
    }
    return ret.join('');
}
exports.packParam = packParam;
function escape(d) {
    switch (typeof d) {
        default: return d;
        case 'string':
            let len = d.length;
            let r = '', p = 0;
            for (let i = 0; i < len; i++) {
                let c = d.charCodeAt(i);
                switch (c) {
                    case 9:
                        r += d.substring(p, i) + '\\t';
                        p = i + 1;
                        break;
                    case 10:
                        r += d.substring(p, i) + '\\n';
                        p = i + 1;
                        break;
                }
            }
            return r + d.substring(p);
        case 'undefined': return '';
    }
}
function packRow(result, fields, data) {
    let ret = '';
    let len = fields.length;
    ret += escape(data[fields[0].name]);
    for (let i = 1; i < len; i++) {
        let f = fields[i];
        ret += tab + escape(data[f.name]);
    }
    result.push(ret + ln);
}
function packArr(result, fields, data) {
    if (data !== undefined) {
        for (let row of data) {
            packRow(result, fields, row);
        }
    }
    result.push(ln);
}
//# sourceMappingURL=packParam.js.map