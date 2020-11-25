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
exports.centerApi = exports.urlSetCenterHost = void 0;
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
            return yield this.post('open/url-from-uq', { unit: unit, uq: uqFullName });
        });
    }
    unitFaceUrl(unit, busOwner, busName, face) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/unit-face-url', { unit: unit, busOwner: busOwner, busName: busName, face: face });
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
    userIdFromName(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/user-id-from-name', { user: user });
        });
    }
    send(param) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('send', param);
        });
    }
    queueOut(start, page) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/queue-out', { start: start, page: page });
        });
    }
    appRoles(unit, app, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/app-roles', { unit, app, user });
        });
    }
    userxBusFace(user, bus, face) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.post('open/userx-bus-face', { user, bus, face });
        });
    }
}
;
exports.centerApi = new CenterApi();
//# sourceMappingURL=centerApi.js.map