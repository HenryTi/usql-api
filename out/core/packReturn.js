"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = exports.packArr = exports.packBus = exports.packReturns = exports.packReturnsFromSchema = exports.packParam = void 0;
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
const tab = '\t';
const ln = '\n';
function packParam(schema, data) {
    let { fields, arrs } = schema;
    let ret = [];
    if (fields !== undefined)
        packRow(ret, fields, data);
    if (arrs !== undefined) {
        for (let arr of arrs) {
            let arrFields = arr.fields;
            packArr(ret, arrFields, data[arr.name]);
        }
    }
    return ret.join('');
}
exports.packParam = packParam;
function packReturnsFromSchema(schema, data) {
    if (schema === undefined)
        return;
    return packReturns(schema['returns'], data);
}
exports.packReturnsFromSchema = packReturnsFromSchema;
function packReturns(returns, data) {
    if (data === undefined)
        return;
    if (returns === undefined)
        return '';
    let ret = [];
    let len = returns.length;
    if (len === 1) {
        let fields = returns[0].fields;
        packArr(ret, fields, data);
    }
    else {
        for (let i = 0; i < len; i++) {
            let arr = returns[i];
            packArr(ret, arr.fields, data[i]);
        }
    }
    return ret.join('');
}
exports.packReturns = packReturns;
function packBus(schema, data) {
    let result = [];
    if (data !== undefined) {
        let len = data.length;
        for (let i = 0; i < len; i++)
            packBusMain(result, schema, data[0]);
    }
    return result.join('');
}
exports.packBus = packBus;
function packBusMain(result, schema, main) {
    let { fields, arrs } = schema;
    packRow(result, fields, main);
    if (arrs !== undefined && arrs.length > 0) {
        for (let arr of arrs) {
            let { name, fields } = arr;
            packArr(result, fields, main[name]);
        }
        result.push(ln);
    }
    else {
        result.push(ln, ln, ln);
    }
}
function escape(d, field) {
    //if (d === null) return '\b';
    if (d === null)
        return '';
    if (field.type === 'bin') {
        return d;
    }
    switch (typeof d) {
        default:
            if (d instanceof Date)
                return d.getTime() / 1000; //-timezoneOffset-timezoneOffset;
            return d;
        case 'string':
            if (field.type === 'datetime') {
                return new Date(d).getTime() / 1000;
            }
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
    let f;
    if (len > 0) {
        f = fields[0];
        ret += escape(data[f.name], f);
    }
    for (let i = 1; i < len; i++) {
        f = fields[i];
        ret += tab + escape(data[f.name], f);
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
exports.packArr = packArr;
function unpack(schema, data) {
    let ret = {};
    if (schema === undefined || data === undefined)
        return;
    let fields = schema.fields;
    let p = 0;
    if (fields !== undefined)
        p = unpackRow(ret, schema.fields, data, p);
    let arrs = schema['arrs'];
    if (arrs !== undefined) {
        for (let arr of arrs) {
            p = unpackArr(ret, arr, data, p);
        }
    }
    return ret;
}
exports.unpack = unpack;
function unpackRow(ret, fields, data, p) {
    let c = p, i = 0, len = data.length, fLen = fields.length;
    for (; p < len; p++) {
        let ch = data.charCodeAt(p);
        if (ch === 9) {
            let f = fields[i];
            let v = data.substring(c, p);
            ret[f.name] = to(v, f.type);
            c = p + 1;
            ++i;
            if (i >= fLen)
                break;
        }
        else if (ch === 10) {
            let f = fields[i];
            let v = data.substring(c, p);
            ret[f.name] = to(v, f.type);
            ++p;
            ++i;
            break;
        }
    }
    return p;
    function to(v, type) {
        switch (type) {
            default: return v;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(v);
        }
    }
}
function unpackArr(ret, arr, data, p) {
    let vals = [], len = data.length;
    let { name, fields } = arr;
    while (p < len) {
        let ch = data.charCodeAt(p);
        if (ch === 10) {
            ++p;
            break;
        }
        let val = {};
        vals.push(val);
        p = unpackRow(val, fields, data, p);
    }
    ret[name] = vals;
    return p;
}
//# sourceMappingURL=packReturn.js.map