"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExpCalc = exports.buildExpVar = void 0;
__exportStar(require("./buildLicense"), exports);
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