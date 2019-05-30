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
const router_1 = require("./router");
const entityProcess_1 = require("./entityProcess");
const packReturn_1 = require("../core/packReturn");
const tuidType = 'tuid';
function default_1(router) {
    entityProcess_1.entityGet(router, tuidType, '/:name/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id } = urlParams;
        let result = yield runner.tuidGet(name, unit, user, id);
        let arr0 = result[0];
        let value = undefined;
        if (arr0.length > 0) {
            value = arr0[0];
            let { arrs } = schema;
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    value[arrs[i].name] = result[i + 1];
                }
            }
        }
        return value;
    }));
    entityProcess_1.entityGet(router, tuidType, '-arr/:name/:owner/:arr/:id/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id, owner, arr } = urlParams;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let result = yield runner.tuidArrGet(name, arr, unit, user, owner, id);
        let row = result[0];
        return row;
    }));
    entityProcess_1.entityGet(router, tuidType, '-all/:name/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let result = yield runner.tuidGetAll(name, unit, user);
        return result;
    }));
    entityProcess_1.entityGet(router, tuidType, '-vid/:name/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { u } = body;
        let result = yield runner.tuidVid(name, unit, u);
        return result[0].id;
    }));
    entityProcess_1.entityGet(router, tuidType, '-arr-vid/:name/:arr', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { u } = body;
        let result = yield runner.tuidArrVid(name, urlParams.arr, unit, u);
        return result[0].id;
    }));
    entityProcess_1.entityGet(router, tuidType, '-arr-all/:name/:owner/:arr/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { owner, arr } = urlParams;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let result = yield runner.tuidGetArrAll(name, arr, unit, user, owner);
        return result;
    }));
    entityProcess_1.entityGet(router, tuidType, '-proxy/:name/:type/:id', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { id, type } = urlParams;
        let result = yield runner.tuidProxyGet(name, unit, user, id, type);
        let row = result[0];
        return row;
    }));
    entityProcess_1.entityPost(router, tuidType, '/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let id = body["$id"];
        let dbParams = [id];
        let fields = schema.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = yield runner.tuidSave(name, unit, user, dbParams);
        let row = result[0];
        if (!id)
            id = row.id;
        if (id < 0)
            id = -id;
        if (id > 0) {
            let { arrs } = schema;
            if (arrs !== undefined) {
                for (let arr of arrs) {
                    let arrName = arr.name;
                    let fields = arr.fields;
                    let arrValues = body[arrName];
                    if (arrValues === undefined)
                        continue;
                    for (let arrValue of arrValues) {
                        let arrParams = [id, arrValue[arr.id]];
                        let len = fields.length;
                        for (let i = 0; i < len; i++) {
                            arrParams.push(arrValue[fields[i].name]);
                        }
                        yield runner.tuidArrSave(name, arrName, unit, user, arrParams);
                    }
                }
            }
        }
        return row;
    }));
    entityProcess_1.entityPost(router, tuidType, '-arr/:name/:owner/:arr/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { owner, arr } = urlParams;
        let schemaArr = router_1.getTuidArr(schema, arr);
        let id = body["$id"];
        let dbParams = [owner, id];
        let fields = schemaArr.fields;
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            dbParams.push(body[fields[i].name]);
        }
        let result = yield runner.tuidArrSave(name, arr, unit, user, dbParams);
        let row = result[0];
        return row;
    }));
    entityProcess_1.entityPost(router, tuidType, '-arr-pos/:name/:owner/:arr/', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { owner, arr } = urlParams;
        let { $id, $order } = body;
        let dbParams = [owner, $id, $order];
        let result = yield runner.tuidArrPos(name, arr, unit, user, dbParams);
        return undefined;
    }));
    entityProcess_1.entityPost(router, tuidType, 'ids/:name/:arr', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { arr } = urlParams;
        let ids = body.join(',');
        let result = yield runner.tuidIds(name, arr, unit, user, ids);
        if (arr === '$') {
            let { mainFields } = schema;
            if (mainFields !== undefined) {
                let ret = [];
                packReturn_1.packArr(ret, mainFields, result);
                return ret.join('');
            }
        }
        else {
            let { arrs } = schema;
            let arrSchema = arrs.find(v => v.name === arr);
            let { mainFields } = arrSchema;
            if (mainFields !== undefined) {
                let ret = [];
                packReturn_1.packArr(ret, mainFields, result);
                return ret.join('');
            }
        }
        return result;
    }));
    entityProcess_1.entityPost(router, tuidType, 's/:name', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { arr, owner, key, pageStart, pageSize } = body;
        let result = arr === undefined ?
            yield runner.tuidSeach(name, unit, user, arr, key, pageStart, pageSize)
            :
                yield runner.tuidArrSeach(name, unit, user, arr, owner, key, pageStart, pageSize);
        let rows = result[0];
        return rows;
    }));
    entityProcess_1.entityPost(router, tuidType, 'import/:name/:arr', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { arr } = urlParams;
        let entity = arr !== undefined ? name + '.' + arr : name;
        let filePath = 'C:/Users/Henry/Desktop/Results.csv';
        yield runner.importData(unit, user, body.source, entity, filePath);
        return;
    }));
}
exports.default = default_1;
;
//# sourceMappingURL=tuid.js.map