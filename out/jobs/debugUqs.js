"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
exports.debugUqs = core_1.isDevelopment === true ?
    ['warehouse']
    : undefined;
exports.bench = new core_1.Bench();
//# sourceMappingURL=debugUqs.js.map