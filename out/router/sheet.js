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
const processRequest_1 = require("./processRequest");
const sheetType = 'sheet';
function default_1(router) {
    processRequest_1.post(router, sheetType, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { app, discription, data } = body;
        let result = yield runner.sheetSave(name, unit, user, app, discription, data);
        let sheetRet = result[0];
        if (sheetRet !== undefined) {
            let sheetMsg = {
                unit: unit,
                type: sheetType,
                from: user,
                db: db,
                body: sheetRet,
                to: [user],
            };
            yield queue_1.queueToUnitx(sheetMsg);
        }
        return sheetRet;
    }));
    processRequest_1.put(router, sheetType, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
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
    processRequest_1.post(router, sheetType, '/:name/states', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { state, pageStart, pageSize } = body;
        let result = yield runner.sheetStates(name, state, unit, user, pageStart, pageSize);
        return result;
    }));
    processRequest_1.get(router, sheetType, '/:name/statecount', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.sheetStateCount(name, unit, user);
        return result;
    }));
    processRequest_1.get(router, sheetType, '/:name/get/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.getSheet(name, unit, user, id);
        return result;
    }));
    processRequest_1.post(router, sheetType, '/:name/archives', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { pageStart, pageSize } = body;
        let result = yield runner.sheetArchives(name, unit, user, pageStart, pageSize);
        return result;
    }));
    processRequest_1.get(router, sheetType, '/:name/archive/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.sheetArchive(unit, user, name, id);
        return result;
    }));
}
exports.default = default_1;
//# sourceMappingURL=sheet.js.map