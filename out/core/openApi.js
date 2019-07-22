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
//import fetch from "node-fetch";
const _1 = require(".");
class OpenApi extends _1.Fetch {
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
}
exports.OpenApi = OpenApi;
/*
const uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
export async function getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
    let openApis = uqOpenApis[uqFullName];
    if (openApis === null) return null;
    if (openApis !== undefined) {
        let ret = openApis[unit];
        if (ret === null) return null;
        if (ret !== undefined) return ret;
    }
    
    uqOpenApis[uqFullName] = openApis = {};
    let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
    if (uqUrl === undefined) return openApis[unit] = null;
    let {url, urlDebug} = uqUrl;
    if (urlDebug) {
        try {
            urlDebug = urlSetUqHost(urlDebug);
            urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            url = urlDebug;
        }
        catch (err) {
        }
    }
    return openApis[unit] = new OpenApi(url);
}
*/ 
//# sourceMappingURL=openApi.js.map