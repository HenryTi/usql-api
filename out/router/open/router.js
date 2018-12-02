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
exports.router = express_1.Router({ mergeParams: true });
(function (router) {
    post(router, '/fresh', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        body.$ = 'open/fresh';
        console.log(body);
        let { unit, stamps } = body;
        // tuidStamps: 'tuid-name'  stamp  id, tab分隔，\n分行
        try {
            let ret = yield runner.call('$$open_fresh', [unit, stamps.map(v => v.join('\t')).join('\n')]);
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
    post(router, '/bus', (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { unit, type, id } = body;
        let ret = yield runner.call('GetBusMessage', [undefined, undefined, unit, type, id]);
        console.log(ret);
        return ret;
    }));
})(exports.router);
function post(router, path, processer) {
    router.post(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function get(router, path, processer) {
    router.get(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function put(router, path, processer) {
    router.put(path, (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield process(req, res, processer);
    }));
}
;
function process(req, res, processer) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let db = req.params.db;
            let runner = yield router_1.checkRunner(db, res);
            if (runner === undefined)
                return;
            let body = req.body;
            let result = yield processer(runner, body);
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