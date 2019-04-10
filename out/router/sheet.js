"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("../queue");
const entityProcess_1 = require("./entityProcess");
const core_1 = require("../core");
const constSheet = 'sheet';
function default_1(router) {
    entityProcess_1.entityPost(router, constSheet, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { app, discription, data } = body;
        let verify = yield runner.sheetVerify(name, unit, user, data);
        if (verify !== undefined) {
            return verify;
        }
        let result = yield runner.sheetSave(name, unit, user, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            let sheetMsg = {
                unit: unit,
                type: constSheet,
                from: user,
                db: db,
                body: sheetRet,
                to: [user],
                subject: discription
            };
            yield queue_1.queueToUnitx(sheetMsg);
            let { id, flow } = sheetRet;
            yield runner.sheetProcessing(id);
            yield queue_1.queueSheet({
                db: db,
                from: user,
                sheetHead: {
                    sheet: name,
                    state: '$',
                    action: '$onsave',
                    unit: unit,
                    user: user,
                    id: id,
                    flow: flow,
                }
            });
        }
        return sheetRet;
    }));
    entityProcess_1.entityPut(router, constSheet, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        yield runner.sheetProcessing(body.id);
        let { state, action, id, flow } = body;
        yield queue_1.queueSheet({
            db: db,
            from: user,
            sheetHead: {
                sheet: name,
                state: state,
                action: action,
                unit: unit,
                user: user,
                id: id,
                flow: flow,
            }
        });
        return { msg: 'add to queue' };
    }));
    entityProcess_1.entityPost(router, constSheet, '/:name/states', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, pageStart, pageSize } = body;
        let result = yield runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    }));
    entityProcess_1.entityGet(router, constSheet, '/:name/statecount', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.sheetStateCount(name, unit, user);
        return result;
    }));
    entityProcess_1.entityPost(router, constSheet, '/:name/my-sheets', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, pageStart, pageSize } = body;
        let result = yield runner.mySheets(name, state, unit, user, pageStart, pageSize);
        return result;
    }));
    entityProcess_1.entityGet(router, constSheet, '-scan/:name/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.sheetScan(name, unit, user, id);
        let main = result[0];
        if (main === undefined)
            return;
        let data = main.data;
        let json = core_1.unpack(schema, data);
        main.data = json;
        return main;
    }));
    entityProcess_1.entityGet(router, constSheet, '/:name/get/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.getSheet(name, unit, user, id);
        return result;
    }));
    entityProcess_1.entityPost(router, constSheet, '/:name/archives', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { pageStart, pageSize } = body;
        let result = yield runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    }));
    entityProcess_1.entityGet(router, constSheet, '/:name/archive/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.sheetArchive(unit, user, name, id);
        return result;
    }));
}
exports.default = default_1;
//# sourceMappingURL=sheet.js.map