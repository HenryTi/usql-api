"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
//export * from './router';
__export(require("./setting"));
__export(require("./open"));
__export(require("./unitx"));
const access_1 = require("./access");
const action_1 = require("./action");
const book_1 = require("./book");
const history_1 = require("./history");
const query_1 = require("./query");
const schema_1 = require("./schema");
const tuid_1 = require("./tuid");
const sheet_1 = require("./sheet");
//import {router} from './router';
const import_1 = require("./import");
//import settingRouter from './setting';
function buildEntityRouter(router, rb) {
    access_1.buildAccessRouter(router, rb);
    action_1.buildActionRouter(router, rb);
    book_1.buildBookRouter(router, rb);
    history_1.buildHistoryRouter(router, rb);
    query_1.buildQueryRouter(router, rb);
    schema_1.buildSchemaRouter(router, rb);
    tuid_1.buildTuidRouter(router, rb);
    sheet_1.buildSheetRouter(router, rb);
    import_1.buildImportRouter(router, rb);
}
exports.buildEntityRouter = buildEntityRouter;
//settingRouter(router);
//# sourceMappingURL=index.js.map