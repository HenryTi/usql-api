"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullEntities = void 0;
const core_1 = require("../core");
function pullEntities(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let { froms, hasPullEntities } = runner;
        if (hasPullEntities === false)
            return;
        if (froms === undefined)
            return;
        try {
            yield pullNew(runner);
            yield pullModify(runner);
        }
        catch (err) {
            debugger;
            if (err && err.message)
                console.error(err.message);
        }
    });
}
exports.pullEntities = pullEntities;
var FromNewSet;
(function (FromNewSet) {
    FromNewSet[FromNewSet["ok"] = 1] = "ok";
    FromNewSet[FromNewSet["bad"] = 2] = "bad";
    FromNewSet[FromNewSet["moreTry"] = 3] = "moreTry";
})(FromNewSet || (FromNewSet = {}));
function pullNew(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let { net } = runner;
        let count = 0;
        for (; count < 200;) {
            let items = yield runner.tableFromProc('$from_new', undefined);
            if (items.length === 0) {
                break;
            }
            for (let item of items) {
                count++;
                let { id, unit, entity, key, tries, update_time, now } = item;
                let fns;
                try {
                    if (unit === undefined)
                        unit = runner.uniqueUnit;
                    if (tries > 0) {
                        // 上次尝试之后十分钟内不尝试
                        if (now - update_time < tries * 10 * 60)
                            continue;
                    }
                    let schema = runner.getSchema(entity);
                    if (schema === undefined)
                        continue;
                    let { from } = schema;
                    if (!from)
                        continue;
                    let openApi = yield net.openApiUnitUq(unit, from);
                    if (!openApi)
                        continue;
                    yield pullEntity(runner, openApi, schema, unit, entity, key);
                    fns = FromNewSet.ok;
                }
                catch (err) {
                    if (tries > 5)
                        fns = FromNewSet.bad;
                    else
                        fns = FromNewSet.moreTry;
                }
                finally {
                    yield runner.call('$from_new_set', [unit, id, fns]);
                }
            }
        }
    });
}
function pullModify(runner) {
    return __awaiter(this, void 0, void 0, function* () {
        let { net } = runner;
        let items = yield runner.tableFromProc('$sync_from', undefined);
        if (items.length === 0)
            return;
        let unitOpenApiItems = {};
        // 把访问同一个openApi的整理到一起
        let promises = [];
        let params = [];
        let count = 0;
        for (let item of items) {
            let { unit, entity, modifyMax } = item;
            if (!unit)
                unit = runner.uniqueUnit;
            let schema = runner.getSchema(entity);
            if (schema === undefined) {
                debugger;
                continue;
            }
            let { type, from } = schema;
            if (!from)
                continue;
            let openApiPromise = net.openApiUnitUq(unit, from);
            promises.push(openApiPromise);
            params.push({ from: from, unit: unit, modifyMax: modifyMax, entity: entity });
        }
        let openApis = yield Promise.all(promises);
        let len = openApis.length;
        for (let i = 0; i < len; i++) {
            let openApi = openApis[i];
            if (!openApi)
                continue;
            let { from, unit, modifyMax, entity } = params[i];
            let openApiItems = unitOpenApiItems[unit];
            if (openApiItems === undefined) {
                unitOpenApiItems[unit] = openApiItems = [{
                        openApi: openApi,
                        entities: [entity],
                        modifyMax: modifyMax
                    }];
            }
            else {
                let openApiItem = openApiItems.find(v => v.openApi === openApi);
                if (openApiItem === undefined) {
                    openApiItems.push({
                        openApi: openApi,
                        entities: [entity],
                        modifyMax: modifyMax,
                    });
                }
                else {
                    openApiItem.entities.push(entity);
                    if (modifyMax > openApiItem.modifyMax) {
                        openApiItem.modifyMax = modifyMax;
                    }
                }
            }
        }
        // 从from uq获取数据
        let page = 100;
        for (let unit in unitOpenApiItems) {
            if (count > 200)
                break;
            let openApiItems = unitOpenApiItems[unit];
            for (let openApiItem of openApiItems) {
                try {
                    // 只有exists items 需要pull modify
                    // 对于tuid，id必须存在
                    // 对于map，key0必须存在
                    let { openApi, entities, modifyMax } = openApiItem;
                    let ret = yield openApi.queueModify(unit, modifyMax, page, entities.join('\t'));
                    let { queue, queueMax } = ret;
                    if (queue.length === 0) {
                        for (let entity of entities) {
                            yield runner.call('$sync_from_set', [unit, entity, queueMax]);
                        }
                        continue;
                    }
                    let entityModifies = {};
                    for (let item of queue) {
                        let { id: modifyId, entity, key } = item;
                        let em = entityModifies[entity];
                        if (em === undefined) {
                            entityModifies[entity] = em = {
                                modifies: '',
                                idMax: 0
                            };
                        }
                        em.modifies += modifyId + '\t' + key + '\n';
                        em.idMax = modifyId;
                    }
                    for (let entity in entityModifies) {
                        ++count;
                        let schema = runner.getSchema(entity);
                        let { modifies, idMax } = entityModifies[entity];
                        let ret = yield runner.checkPull(unit, entity, schema.type, modifies);
                        for (let item of ret) {
                            let { modifyId, key } = item;
                            yield pullEntity(runner, openApi, schema, unit, entity, key);
                        }
                        if (queue.length < page && idMax < queueMax)
                            idMax = queueMax;
                        if (idMax > 0) {
                            yield runner.call('$sync_from_set', [unit, entity, idMax]);
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    });
}
function pullEntity(runner, openApi, schema, unit, entity, key) {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = yield openApi.fromEntity(unit, entity, key);
        switch (schema.type) {
            case 'tuid':
                yield setTuid(runner, entity, schema, unit, ret);
                break;
            case 'map':
                yield setMap(runner, entity, schema, unit, ret);
                break;
        }
    });
}
function setMap(runner, mapName, schema, unit, values) {
    return __awaiter(this, void 0, void 0, function* () {
        let map = schema; // runner.getMap(mapName);
        if (map === undefined)
            return;
        let { actions } = map.call;
        let { sync } = actions;
        let data = {
            //__id: id,
            arr1: values
        };
        let param = core_1.packParam(sync, data);
        yield runner.action(sync.name, unit, undefined, param);
        return;
    });
}
function setTuid(runner, tuidName, schema, unit, values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = undefined;
            let tuid = schema.call; // runner.getTuid(tuidName);
            let { id: idFieldName, fields, arrs } = tuid;
            let main = values[0];
            if (Array.isArray(main))
                main = main[0];
            if (main === undefined) {
                //await runner.tuidSetStamp(tuidName, unit, [id, -2]);
                return;
            }
            let idVal = main[idFieldName];
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    let arr = arrs[i];
                    let { name, fields } = arr;
                    let rows = values[i + 1];
                    for (let row of rows) {
                        let param = [idVal, row.id];
                        fields.forEach(v => param.push(row[v.name]));
                        param.push(row.$order);
                        yield runner.tuidArrSave(tuidName, name, unit, user, param);
                    }
                }
            }
            let paramMain = [idVal];
            fields.forEach(v => paramMain.push(main[v.name]));
            //paramMain.push(main.$stamp);
            yield runner.tuidSave(tuidName, unit, user, paramMain);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
//# sourceMappingURL=pullEntities.js.map