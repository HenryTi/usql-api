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
class OpenApi extends core_1.Fetch {
    fresh(unit, stamps) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/fresh', {
                unit: unit,
                stamps: stamps
            });
            return ret;
        });
    }
    tuid(unit, id, tuid, maps) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/tuid', {
                unit: unit,
                id: id,
                tuid: tuid,
                maps: maps,
            });
            return ret;
        });
    }
    bus(faces, faceUnitMessages) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/bus', {
                faces: faces,
                faceUnitMessages: faceUnitMessages,
            });
            return ret;
        });
    }
}
exports.OpenApi = OpenApi;
const usqOpenApis = {};
function getOpenApi(usqFullName, unit) {
    return __awaiter(this, void 0, void 0, function* () {
        let openApis = usqOpenApis[usqFullName];
        if (openApis === null)
            return null;
        if (openApis === undefined) {
            usqOpenApis[usqFullName] = openApis = {};
        }
        let usqUrl = yield core_1.centerApi.urlFromUsq(unit, usqFullName);
        if (usqUrl === undefined)
            return openApis[unit] = null;
        let { url, urlDebug } = usqUrl;
        if (urlDebug !== undefined) {
            try {
                urlDebug = core_1.urlSetUsqHost(urlDebug);
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
        return openApis[unit] = new OpenApi(url);
    });
}
exports.getOpenApi = getOpenApi;
//# sourceMappingURL=openApi.js.map