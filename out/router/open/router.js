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
exports.buildOpenRouter = void 0;
function buildOpenRouter(router, rb) {
    rb.get(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    rb.get(router, '/entity/:entityName', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return runner.getSchema(params.entityName);
    }));
    rb.post(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    rb.post(router, '/from-entity', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, entity, key } = body;
        let schema = runner.getSchema(entity);
        let { type } = schema;
        if (type === 'tuid') {
            let tuidRet = yield runner.unitUserCall('tv_' + entity, unit, undefined, key);
            return tuidRet;
        }
        if (type === 'map') {
            let keys = key.split('\t');
            let len = keys.length;
            for (let i = 0; i < len; i++) {
                if (!key[i])
                    keys[i] = undefined;
            }
            let { keys: keyFields } = schema.call;
            let fieldsLen = keyFields.length;
            for (let i = len; i < fieldsLen; i++) {
                keys.push(undefined);
            }
            let mapRet = yield runner.unitUserCall('tv_' + entity + '$query$', unit, undefined, keys);
            return mapRet;
        }
    }));
    rb.post(router, '/queue-modify', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, start, page, entities } = body;
        let ret = yield runner.unitTablesFromProc('tv_$modify_queue', unit, start, page, entities);
        let ret1 = ret[1];
        let modifyMax = ret1.length === 0 ? 0 : ret1[0].max;
        runner.setModifyMax(unit, modifyMax);
        return {
            queue: ret[0],
            queueMax: modifyMax
        };
    }));
    rb.post(router, '/bus-query', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, busOwner, busName, face: faceName, params } = body;
        let faceUrl = `${busOwner}/${busName}/${faceName}`;
        let face = runner.buses.coll[faceUrl];
        let { bus } = face;
        let ret = yield runner.tablesFromProc(bus + '_' + faceName, [unit, 0, ...params]);
        return ret;
    }));
    rb.post(router, '/tuid-main/:tuid', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-main/';
        console.log(body);
        let { tuid } = params;
        let { unit, id, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        let ret = yield runner.unitUserCall('tv_' + tuid + suffix, unit, undefined, id);
        return ret;
    }));
    rb.post(router, '/tuid-div/:tuid/:div', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-div/';
        console.log(body);
        let { tuid, div } = params;
        let { unit, id, ownerId, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        return yield runner.unitUserCall(`tv_${tuid}_${div}${suffix}`, unit, undefined, ownerId, id);
    }));
}
exports.buildOpenRouter = buildOpenRouter;
;
//# sourceMappingURL=router.js.map