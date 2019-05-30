"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./router"));
__export(require("./setting"));
var open_1 = require("./open");
exports.openRouter = open_1.openRouter;
const router_1 = require("./router");
const access_1 = require("./access");
const schema_1 = require("./schema");
const tuid_1 = require("./tuid");
const sheet_1 = require("./sheet");
const action_1 = require("./action");
const book_1 = require("./book");
const history_1 = require("./history");
const query_1 = require("./query");
const import_1 = require("./import");
//import settingRouter from './setting';
access_1.default(router_1.router);
schema_1.default(router_1.router);
tuid_1.default(router_1.router);
sheet_1.default(router_1.router);
action_1.default(router_1.router);
book_1.default(router_1.router);
history_1.default(router_1.router);
query_1.default(router_1.router);
import_1.default(router_1.router);
//settingRouter(router);
//# sourceMappingURL=index.js.map