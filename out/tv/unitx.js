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
const runner_1 = require("../usql/runner");
const centerApi_1 = require("../core/centerApi");
const unitxColl = {};
function sendtoUnitx(jobData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let { unit, busOwner, bus, face, data } = jobData;
            let unitxUrl = yield getUnitxUrl(unit);
            if (unitxUrl === null) {
                console.log('unit %s not have unitx', unit);
                return;
            }
            let unitx = new centerApi_1.UnitxApi(unitxUrl);
            yield unitx.send(jobData);
            console.log(JSON.stringify(data));
        }
        catch (e) {
            console.error(e);
        }
    });
}
exports.sendtoUnitx = sendtoUnitx;
function getUnitxUrl(unit) {
    return __awaiter(this, void 0, void 0, function* () {
        let unitxUrl = unitxColl[unit];
        if (unitxUrl !== undefined)
            return unitxUrl;
        let unitx = yield centerApi_1.centerApi.unitx(unit);
        if (unitx === undefined)
            return unitxColl[unit] = null;
        return unitxColl[unit] = unitx.url;
    });
}
exports.unitxRouter = express_1.Router();
exports.unitxRouter.post('/post', (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        console.log('/unitx/post %s', JSON.stringify(req.body));
        let user = req.user;
        let { db } = user;
        let runner = yield runner_1.getRunner(db);
        if (runner === undefined) {
            res.json({
                ok: false,
                error: 'Database ' + db + ' 不存在'
            });
            return;
        }
        yield runner.unitxPost(req.body);
        res.json({
            ok: true,
        });
    }
    catch (e) {
        res.json({
            ok: false,
            error: e,
        });
    }
}));
//# sourceMappingURL=unitx.js.map