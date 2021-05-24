"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const log4js_1 = require("log4js");
log4js_1.configure({
    appenders: { console: { type: 'console' } },
    categories: { default: { appenders: ['console'], level: 'info' } }
});
exports.logger = log4js_1.getLogger();
exports.logger.debug('log4js replace console.');
//# sourceMappingURL=logger.js.map