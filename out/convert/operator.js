"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operators = void 0;
class Operator {
    run(stack) { }
}
class Op1 extends Operator {
    run(stack) { let v = stack.pop(); stack.push(this.op + ' ' + v); }
}
class Op2 extends Operator {
    run(stack) { let v1 = stack.pop(); let v2 = stack.pop(); stack.push(`(${v2} ${this.op} ${v1})`); }
}
class OpAdd extends Op2 {
    get op() { return '+'; }
}
class OpSub extends Op2 {
    get op() { return '-'; }
}
class OpMul extends Op2 {
    get op() { return '*'; }
}
class OpDiv extends Op2 {
    get op() { return '/'; }
}
class OpCase extends Operator {
}
class OpWhen extends Operator {
}
exports.operators = {
    "%case": new OpCase(),
    "%when": new OpWhen(),
    "+": new OpAdd(),
    "-": new OpSub(),
    "*": new OpMul(),
    "/": new OpDiv(),
};
//# sourceMappingURL=operator.js.map