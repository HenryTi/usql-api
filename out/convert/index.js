"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./buildLicense"));
const operator_1 = require("./operator");
function buildExpVar(exp) {
    let parts = exp.split(' ');
    let vars = [];
    for (let p of parts) {
        if (!p)
            continue;
        if (isNaN(Number(p)) === false)
            continue;
        let op = operator_1.operators[p];
        if (op)
            continue;
        vars.push(p);
    }
    let len = vars.length;
    if (len === 0)
        return '';
    let sql = 'select ';
    sql += selectV(vars[0]);
    for (let i = 1; i < len; i++) {
        let v = vars[i];
        sql += ',' + selectV(v);
    }
    sql += ' into ';
    sql += toV(vars[0]);
    for (let i = 1; i < len; i++) {
        let v = vars[i];
        sql += ',' + toV(v);
    }
    sql += ';';
    return sql;
}
exports.buildExpVar = buildExpVar;
function selectV(v) {
    return `(select ${v} from t where a=1)`;
}
function toV(v) {
    return '@' + v;
}
function buildExpCalc(exp) {
    let stack = [];
    let parts = exp.split(' ');
    for (let p of parts) {
        if (!p)
            continue;
        if (isNaN(Number(p)) === false) {
            stack.push(p);
            continue;
        }
        let op = operator_1.operators[p];
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
exports.buildExpCalc = buildExpCalc;
//# sourceMappingURL=index.js.map