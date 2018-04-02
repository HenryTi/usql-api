"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
export interface ILogger {
    log(log: string);
}

export class Logger implements ILogger {
    private logs: Log[] = [];
    
    log(log:string) {
        if (typeof log === 'string')
            this.logs.push(new InfoLog(log));
        else
            this.logs.push(log);
    }

    output(output: string[]) {
        output.push(...this.logs.map(log => log.toString()));
    }

    clear() {
        this.logs = [];
    }
}

export abstract class Log {
    toString():string {
        return;
    }
}

export class InfoLog {
    private info:string[];
    constructor(...info:string[]) {
        this.info = info;
    }
    toString():string {
        return this.info.join('');
    }
}
*/ 
//# sourceMappingURL=log.js.map