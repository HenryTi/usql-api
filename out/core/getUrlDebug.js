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
exports.getUrlDebug = void 0;
const node_fetch_1 = require("node-fetch");
const db_1 = require("./db");
const urlDebugPromises = {};
function getUrlDebug() {
    return __awaiter(this, void 0, void 0, function* () {
        let urlDebug = `http://${db_1.env.localhost}/`; //urlSetUqHost();
        let urlDebugPromise = urlDebugPromises[urlDebug];
        if (urlDebugPromise === true)
            return urlDebug;
        if (urlDebugPromise === false)
            return undefined;
        if (urlDebugPromise === undefined) {
            urlDebugPromise = fetchHello(urlDebug);
            urlDebugPromises[urlDebug] = urlDebugPromise;
        }
        let ret = yield urlDebugPromise;
        if (ret === null) {
            urlDebugPromises[urlDebug] = false;
            return undefined;
        }
        else {
            urlDebugPromises[urlDebug] = true;
            return ret;
        }
    });
}
exports.getUrlDebug = getUrlDebug;
function fetchHello(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let ret = yield node_fetch_1.default(url + 'hello');
            if (ret.status !== 200)
                throw 'not ok';
            let text = yield ret.text();
            return url;
        }
        catch (_a) {
            return null;
        }
    });
}
//# sourceMappingURL=getUrlDebug.js.map