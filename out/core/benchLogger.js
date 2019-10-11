"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const winston_1 = require("winston");
const { combine, timestamp, label, printf } = winston_1.format;
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
const logger = winston.loggers.get('jobs-performance');
class Bench {
    constructor(actionName) {
        this.start(actionName);
    }
    start(actionName) {
        this.actionName = actionName;
        this.tick = Date.now();
    }
    log() {
        logger.info(`${this.actionName} ${Date.now() - this.tick}ms`);
    }
}
exports.Bench = Bench;
function benchLogger(actionName) {
    return new Bench(actionName);
}
exports.benchLogger = benchLogger;
;
//# sourceMappingURL=benchLogger.js.map