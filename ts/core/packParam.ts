interface Field {
    name: string;
    type: string;
}
interface Arr {
    name:string;
    fields: Field[];
}

const tab = '\t';
const ln = '\n';

export function packParam(schema:any, data:any):string {
    let ret:string[] = [];
    if (schema === undefined || data === undefined) return;
    let fields = schema.fields;
    if (fields !== undefined) packRow(ret, schema.fields, data);
    let arrs = schema['arrs'];
    if (arrs !== undefined) {
        for (let arr of arrs) {
            packArr(ret, arr.fields, data[arr.name]);
        }
    }
    return ret.join('');
}

function escape(d:any):any {
    switch (typeof d) {
        default: return d;
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
