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
const core_1 = require("../core");
function syncTuids(runner, net) {
    return __awaiter(this, void 0, void 0, function* () {
        let { froms, hasSyncTuids } = runner;
        if (hasSyncTuids === false)
            return;
        if (froms === undefined)
            return;
        try {
            let db = runner.getDb();
            let uqs = ['order', 'salestask'];
            if (uqs.indexOf(db) < 0)
                return;
            yield syncNew(runner, net);
            yield syncModify(runner, net);
        }
        catch (err) {
            debugger;
            if (err && err.message)
                console.error(err.message);
        }
    });
}
exports.syncTuids = syncTuids;
function syncNew(runner, net) {
    return __awaiter(this, void 0, void 0, function* () {
        for (;;) {
            let items = yield runner.tableFromProc('$from_new', []);
            if (items.length === 0) {
                break;
            }
            for (let item of items) {
                let { id, unit, entity, key } = item;
                if (unit === undefined)
                    unit = runner.uniqueUnit;
                let schema = runner.getSchema(entity);
                if (schema === undefined)
                    continue;
                let { from } = schema;
                let openApi = yield net.openApiUnitUq(unit, from);
                if (!openApi)
                    continue;
                yield syncEntity(runner, openApi, unit, entity, key);
                yield runner.call('$from_new_finished', [unit, id]);
            }
        }
    });
}
function syncModify(runner, net) {
    return __awaiter(this, void 0, void 0, function* () {
        let items = yield runner.tableFromProc('$sync_from', []);
        if (items.length === 0)
            return;
        let unitOpenApiItems = {};
        // 把访问同一个openApi的整理到一起
        let promises = [];
        let params = [];
        for (let item of items) {
            let { unit, entity, modifyMax } = item;
            if (!unit)
                unit = runner.uniqueUnit;
            let schema = runner.getSchema(entity);
            if (schema === undefined)
                debugger;
            let { type, from } = schema;
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
            let openApiItems = unitOpenApiItems[unit];
            for (let openApiItem of openApiItems) {
                try {
                    let { openApi, entities, modifyMax } = openApiItem;
                    let ret = yield openApi.queueModify(unit, modifyMax, page, entities.join('\t'));
                    let { queue, queueMax } = ret;
                    for (let item of queue) {
                        let { id, entity, key } = item;
                        yield syncEntity(runner, openApi, unit, entity, key);
                        yield runner.call('$sync_from_set', [unit, entity, id]);
                    }
                    if (queue.length < page && modifyMax < queueMax) {
                        for (let item of queue) {
                            let { entity } = item;
                            yield runner.call('$sync_from_set', [unit, entity, queueMax]);
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
function syncEntity(runner, openApi, unit, entity, key) {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = yield openApi.fromEntity(unit, entity, key);
        let schema = runner.getSchema(entity);
        switch (schema.type) {
            case 'tuid':
                yield setTuid(runner, entity, unit, ret);
                break;
            case 'map':
                yield setMap(runner, entity, unit, ret);
                break;
        }
    });
}
function setMap(runner, mapName, unit, /*id:number, */ values) {
    return __awaiter(this, void 0, void 0, function* () {
        let map = runner.getMap(mapName);
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
function setTuid(runner, tuidName, unit, /*id:number, */ values) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = undefined;
            let tuid = runner.getTuid(tuidName);
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
            paramMain.push(main.$stamp);
            yield runner.tuidSave(tuidName, unit, user, paramMain);
        }
        catch (err) {
            console.log(err.message);
        }
    });
}
//# sourceMappingURL=syncTuids.js.map