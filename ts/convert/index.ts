import { operators } from "./operator";

export function buildExpVar(exp:string):string {
    let parts = exp.split(' ');
    let vars:string[] = [];
    for (let p of parts) {
        if (!p) continue;
        if (isNaN(Number(p)) === false) continue;
        let op = operators[p];
        if (op) continue;
        vars.push(p);
    }
    let len = vars.length;
    if (len === 0) return '';
    let sql = 'select ';
    sql += selectV(vars[0]);
    for (let i=1; i<len; i++) {
        let v = vars[i];
        sql += ',' + selectV(v);
    }

    sql += ' into ';
    sql += toV(vars[0]);
    for (let i=1; i<len; i++) {
        let v = vars[i];
        sql += ',' + toV(v);
    }
    sql += ';'
    return sql;
}

function selectV(v:string):string {
    return `(select ${v} from t where a=1)`;
}

function toV(v:string):string {
    return '@' + v;
}

export function buildExpCalc(exp:string):string {
    let stack:string[] = [];
    let parts = exp.split(' ');
    for (let p of parts) {
        if (!p) continue;
        if (isNaN(Number(p)) === false) {
            stack.push(p);
            continue;
        }
        let op = operators[p];
        if (op) {
            op.run(stack);
            continue;
        }
        stack.push(toV(p));
    }
    if (stack.length !== 1) {
        debugger;
        throw new Error('expression error!');
    }
    return stack[0];
}