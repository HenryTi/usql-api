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
const express_1 = require("express");
const router_1 = require("../router");
const busQueueSeed_1 = require("../../core/busQueueSeed");
exports.router = express_1.Router({ mergeParams: true });
(function (router) {
    get(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    get(router, '/entity/:entityName', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return runner.getSchema(params.entityName);
    }));
    post(router, '/entities/:unit', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.getEntities(params.unit);
    }));
    post(router, '/fresh', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, stamps } = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        let stampsText = stamps.map((v) => v.join('\t')).join('\n');
        try {
            let ret = yield runner.call('$$open_fresh', [unit, stampsText]);
            return ret;
        }
        catch (err) {
            console.log(err.message);
        }
    }));
    post(router, '/tuid', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid';
        console.log(body);
        let { unit, id, tuid, maps } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let ret = {};
        let tuidRet = yield runner.call(tuid, [unit, undefined, id]);
        ret[tuid] = tuidRet;
        if (maps !== undefined) {
            for (let m of maps) {
                let map = runner.getMap(m);
                if (map === undefined)
                    continue;
                let { keys } = map.call;
                let params = [unit, undefined, id];
                for (let i = 1; i < keys.length; i++)
                    params.push(undefined);
                let mapRet = yield runner.call(m + '$query$', params);
                ret[m] = mapRet;
            }
        }
        return ret;
    }));
    post(router, '/tuid-main/:tuid', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-main/';
        console.log(body);
        let { tuid } = params;
        let { unit, id, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        let ret = yield runner.call(tuid + suffix, [unit, undefined, id]);
        return ret;
    }));
    post(router, '/tuid-div/:tuid/:div', (runner, body, params) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/tuid-div/';
        console.log(body);
        let { tuid, div } = params;
        let { unit, id, ownerId, all } = body;
        if (runner.isTuidOpen(tuid) === false)
            return;
        // maps: tab分隔的map名字
        let suffix = (all === true ? '$id' : '$main');
        return yield runner.call(`${tuid}_${div}${suffix}`, [unit, undefined, ownerId, id]);
    }));
    post(router, '/bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, faces, faceUnitMessages } = body;
        let ret = yield runner.call('GetBusMessages', [unit, undefined, faces, faceUnitMessages]);
        console.log('$unitx/open/bus - GetBusMessages - ', ret);
        return ret;
    }));
    post(router, '/joint-read-bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, queue } = body;
        if (queue === undefined)
            queue = busQueueSeed_1.busQueueSeed();
        let ret = yield runner.call('BusMessageFromQueue', [unit, undefined, face, queue]);
        if (ret.length === 0)
            return;
        return ret[0];
    }));
    post(router, '/joint-write-bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, face, from, sourceId, body: message } = body;
        /*
        let data = '';
        if (face !== null && face !== undefined) data += face;
        data += '\t';
        if (from !== null && from !== undefined) data += from;
        data += '\t';
        if (sourceId !== null && sourceId !== undefined) data += sourceId;
        data += '\t';
        data += message + '\n';
        */
        let ret = yield runner.call('SaveBusMessage', [unit, undefined, face, from, sourceId, message]);
        //let ret = await runner.call('SaveBusMessage', [unit, undefined, data]);
        return ret;
    }));
})(exports.router);
function post(router, path, processer) {
    router.post(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer, req.body, req.params);
    }));
}
;
function get(router, path, processer) {
    router.get(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer, req.query, req.params);
    }));
}
;
function put(router, path, processer) {
    router.put(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer, req.body, req.params);
    }));
}
;
function process(req, res, processer, queryOrBody, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let db = req.params.db;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            //let body = (req as any).body;
            let result = yield processer(runner, queryOrBody, params);
            res.json({
                ok: true,
                res: result
            });
        }
        catch (err) {
            res.json({ error: err });
        }
    });
}
//# sourceMappingURL=router.js.map