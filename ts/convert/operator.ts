abstract class Operator {
    run(stack: string[]):void {}
}

abstract class Op1 extends Operator {
    abstract get op():string;
    run(stack: string[]):void {let v=stack.pop(); stack.push(this.op + ' ' + v)}
}

abstract class Op2 extends Operator {
    abstract get op():string;
    run(stack: string[]):void {let v1=stack.pop(); let v2=stack.pop(); stack.push(`(${v2} ${this.op} ${v1})`)}
}

class OpAdd extends Op2 {get op():string {return '+'}}
class OpSub extends Op2 {get op():string {return '-'}}
class OpMul extends Op2 {get op():string {return '*'}}
class OpDiv extends Op2 {get op():string {return '/'}}

class OpCase extends Operator {}
class OpWhen extends Operator {}

export const operators:{[op:string]: Operator} = {
    "%case": new OpCase(), 
    "%when" : new OpWhen(), 
    "+": new OpAdd(),
    "-": new OpSub(),
    "*": new OpMul(),
    "/": new OpDiv(),
};
