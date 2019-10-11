"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const winston_1 = require("winston");
const { combine, timestamp, label, printf } = winston_1.format;
const core_1 = require("../core");
exports.debugUqs = core_1.isDevelopment === true ?
    ['warehouse']
    : undefined;
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
winston.loggers.add('jobs-performance', {
    format: combine(timestamp(), myFormat),
    transports: [
        new winston.transports.File({
            dirname: 'logs',
            filename: 'jobs-performance.log'
        }),
    ]
});
exports.logger = winston.loggers.get('jobs-performance');
class Bench {
    constructor(actionName) {
        this.actionName = actionName;
        this.tick = Date.now();
    }
    log() {
        exports.logger.info(`${this.actionName} ${Date.now() - this.tick}ms`);
    }
}
function bench(actionName) {
    return new Bench(actionName);
}
exports.bench = bench;
;
//# sourceMappingURL=debugUqs.js.map