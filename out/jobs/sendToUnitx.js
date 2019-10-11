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
const node_fetch_1 = require("node-fetch");
const core_1 = require("../core");
function sendToUnitx(unit, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let unitxApi = yield getUnitxApi(unit);
        if (unitxApi === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let toArr = yield unitxApi.send(msg);
        return toArr;
    });
}
exports.sendToUnitx = sendToUnitx;
class UnitxApi extends core_1.Fetch {
    send(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('unitx', msg);
            return ret;
        });
    }
}
const unitxApis = {};
function getUnitxApi(unit) {
    return __awaiter(this, void 0, void 0, function* () {
        let unitxApi = unitxApis[unit];
        if (unitxApi === null)
            return null;
        if (unitxApi !== undefined)
            return unitxApi;
        let unitx = yield core_1.centerApi.unitx(unit);
        if (unitx === undefined)
            return unitxApis[unit] = null;
        let { url, urlDebug } = unitx;
        if (urlDebug !== undefined) {
            try {
                urlDebug = core_1.urlSetUnitxHost(urlDebug);
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        return unitxApis[unit] = new UnitxApi(url);
    });
}
//# sourceMappingURL=sendToUnitx.js.map