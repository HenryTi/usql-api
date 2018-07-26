interface Field {
    name:string;
    type:string;
}
interface Arr {
    name:string;
    fields: Field[];
}
const timezoneOffset = new Date().getTimezoneOffset()*60000;
const tab = '\t';
const ln = '\n';
export function packReturn(schema:any, data:any):string {
    let ret:string[] = [];
    if (schema === undefined || data === undefined) return;
    //let fields = schema.fields;
    //if (fields !== undefined) packRow(ret, schema.fields, data);
    let arrs = schema['returns'];
    if (arrs === undefined) return '';
    let len = arrs.length;
    if (len === 1) {
        packArr(ret, arrs[0].fields, data);
    }
    else {
        for (let i=0; i<len; i++) {
            let arr = arrs[i];
            packArr(ret, arr.fields, data[i]);
        }
    }
    return ret.join('');
}

interface BusSchema {
    fields: Field[];
    arrs: Arr[];
}
//const bus
export function packBus(schema:BusSchema, data:any):string {
    let result:string[] = [];
    let len = data.length;
    for (let i=0;i<len;i++) packBusMain(result, schema, data[0]);
    return result.join('');
}

function packBusMain(result:string[], schema:BusSchema, main:any) {
    let {fields, arrs} = schema;
    packRow(result, fields, main);
    if (arrs !== undefined && arrs.length > 0) {
        for (let arr of arrs) {
            packArr(result, arr.fields, main[arr.name]);
        }
        result.push(ln);
    }
    else {
        result.push(ln, ln, ln);
    }
}

export function escape(d:any):any {
    if (d === null) return '\b';
    switch (typeof d) {
        default:
            if (d instanceof Date) return (d as Date).getTime(); //-timezoneOffset-timezoneOffset;
            return d;
        case 'string':
            let len = d.length;
            let r = '', p = 0;
            for (let i=0;i<len;i++) {
                let c = d.charCodeAt(i);
                switch(c) {
                    case 9: r += d.substring(p, i) + '\\t'; p = i+1; break;
                    case 10: r += d.substring(p, i) + '\\n'; p = i+1; break;
                }
            }
            return r + d.substring(p);
        case 'undefined': return '';
    }
}

function packRow(result:string[], fields:Field[], data:any) {
    let ret = '';
    let len = fields.length;
    ret += escape(data[fields[0].name]);
    for (let i=1;i<len;i++) {
        let f = fields[i];
        ret += tab + escape(data[f.name]);
    }
    result.push(ret + ln);
}

function packArr(result:string[], fields:Field[], data:any[]) {
    if (data !== undefined) {
        for (let row of data) {
            packRow(result, fields, row);
        }
    }
    result.push(ln);
}

export function unpack(schema:any, data:string):any {
    let ret:any = {};
    if (schema === undefined || data === undefined) return;
    let fields = schema.fields;
    let p = 0;
    if (fields !== undefined) p = unpackRow(ret, schema.fields, data, p);
    let arrs = schema['arrs'];
    if (arrs !== undefined) {
        for (let arr of arrs) {
            p = unpackArr(ret, arr, data, p);
        }
    }
    return ret;
}

function unpackRow(ret:any, fields:Field[], data:string, p:number):number {
    let c = p, i = 0, len = data.length, fLen = fields.length;
    for (;p<len;p++) {
        let ch = data.charCodeAt(p);
        if (ch === 9) {
            let f = fields[i];
            let v = data.substring(c, p);
            ret[f.name] = to(v, f.type);
            c = p+1;
            ++i;
            if (i>=fLen) break;
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
    function to(v:string, type:string):any {
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

function unpackArr(ret:any, arr:Arr, data:string, p:number):number {
    let vals:any[] = [], len = data.length;
    let {name, fields} = arr;
    while (p<len) {
        let ch = data.charCodeAt(p);
        if (ch === 10) {
            ++p;
            break;
        }
        let val:any = {};
        vals.push(val);
        p = unpackRow(val, fields, data, p);
    }
    ret[name] = vals;
    return p;
}
