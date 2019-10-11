import * as winston from 'winston';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
    });
winston.loggers.add('jobs-performance', {
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
        new winston.transports.File({
            dirname:'logs', 
            filename: 'jobs-performance.log'
        }),
    ]
});

const logger = winston.loggers.get('jobs-performance');

export class Bench {
    private actionName:string;
    private tick: number;
    constructor(actionName?:string) {
        this.start(actionName);
    }

    start(actionName: string) {
        this.actionName = actionName;
        this.tick = Date.now();
    }

    log() {
        logger.info(`${this.actionName} ${Date.now() - this.tick}ms`);
    }
}

export function benchLogger(actionName: string) {
    return new Bench(actionName);
};
