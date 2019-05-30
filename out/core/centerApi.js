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
const fetch_1 = require("./fetch");
const centerHost = config.get('centerhost');
const centerUrl = urlSetCenterHost(config.get('center'));
function urlSetCenterHost(url) {
    return url.replace('://centerhost/', '://' + centerHost + '/');
}
exports.urlSetCenterHost = urlSetCenterHost;
class CenterApi extends fetch_1.Fetch {
    constructor() {
        super(centerUrl);
    }
    busSchema(owner, bus) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.get('open/bus', { owner: owner, bus: bus });
            return ret.schema;
        });
    }
    serviceBus(serviceUID, serviceBuses) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.post('open/save-service-bus', {
                service: serviceUID,
                bus: serviceBuses,
            });
        });
    }
    unitx(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/unitx', { unit: unit });
        });
    }
    uqUrl(unit, uq) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/uq-url', { unit: unit, uq: uq });
        });
    }
    urlFromUq(unit, uqFullName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/url-from-uq', { unit: unit, uq: uqFullName });
        });
    }
    uqDb(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/uqdb', { name: name });
        });
    }
    pushTo(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('push', msg);
        });
    }
    unitxBuses(unit, busOwner, bus, face) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/unitx-buses', { unit: unit, busOwner: busOwner, bus: bus, face: face });
        });
    }
    userIdFromName(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/user-id-from-name', { user: user });
        });
    }
}
exports.centerApi = new CenterApi();
//# sourceMappingURL=centerApi.js.map