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
const config = require("config");
const fetch_1 = require("../core/fetch");
const processSheetMessage_1 = require("../unitx-server/processSheetMessage");
const unitxQueue_1 = require("../unitx-server/unitxQueue");
const unitxHost = config.get('unitxhost');
function urlSetUnitxHost(url) {
    return url.replace('://unitxhost/', '://' + unitxHost + '/');
}
exports.urlSetUnitxHost = urlSetUnitxHost;
const localhosts = [
    'localhost',
    '127.0.0.1'
];
class UnitxApi extends fetch_1.Fetch {
    constructor(baseUrl) {
        super(baseUrl);
        let lh = localhosts.find(v => baseUrl.indexOf('://' + v + ':') >= 0) != undefined;
        this.isLocalHost = lh;
    }
    sheet(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret;
            if (this.isLocalHost === true) {
                let { $unit } = msg;
                ret = yield processSheetMessage_1.processSheetMessage($unit, msg);
            }
            else {
                ret = yield this.post('unitx/sheet', msg);
            }
            return ret;
        });
    }
    bus(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret;
            if (this.isLocalHost === true) {
                ret = yield unitxQueue_1.queueUnitx(msg);
            }
            else {
                ret = yield this.post('unitx/bus', msg);
            }
            return ret;
        });
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=unitxApi.js.map