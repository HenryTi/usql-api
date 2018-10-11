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
const config = require("config");
const centerHost = config.get('centerhost');
const centerUrl = urlSetCenterHost(config.get('center'));
function urlSetCenterHost(url) {
    return url.replace('://centerhost/', '://' + centerHost + '/');
}
exports.urlSetCenterHost = urlSetCenterHost;
class Fetch {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    get(url, params = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            if (params) {
                let keys = Object.keys(params);
                if (keys.length > 0) {
                    let c = '?';
                    for (let k of keys) {
                        let v = params[k];
                        if (v === undefined)
                            continue;
                        url += c + k + '=' + params[k];
                        c = '&';
                    }
                }
            }
            return yield this.innerFetch(url, 'GET');
        });
    }
    post(url, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.innerFetch(url, 'POST', params);
        });
    }
    innerFetch(url, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            var headers = new node_fetch_1.Headers();
            headers.append('Accept', 'application/json'); // This one is enough for GET requests
            headers.append('Content-Type', 'application/json'); // This one sends body
            let res = yield node_fetch_1.default(this.baseUrl + url, {
                headers: {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json',
                },
                method: method,
                body: JSON.stringify(body),
            });
            if (res.status !== 200) {
                throw {
                    error: res.statusText,
                    code: res.status,
                };
                //console.log('statusCode=', response.statusCode);
                //console.log('statusMessage=', response.statusMessage);
            }
            let json = yield res.json();
            if (json.ok !== true) {
                throw json.error;
            }
            return json.res;
        });
    }
}
class CenterApi extends Fetch {
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
    usqlDb(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('open/usqldb', { name: name });
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
}
exports.centerApi = new CenterApi();
class UnitxApi extends Fetch {
    send(jobData) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('unitx', jobData);
            return ret;
        });
    }
}
exports.UnitxApi = UnitxApi;
//# sourceMappingURL=centerApi.js.map