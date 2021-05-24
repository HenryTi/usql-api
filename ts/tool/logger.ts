import { configure, getLogger } from "log4js";

configure({
	appenders: { console: { type: 'console' } },
	categories: { default: { appenders: [ 'console' ], level: 'info' } }
});

export const logger = getLogger();
logger.debug('log4js replace console.');
