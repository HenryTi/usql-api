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
const runner_1 = require("./runner");
const db_1 = require("./db");
const openApi_1 = require("./openApi");
const setHostUrl_1 = require("./setHostUrl");
const centerApi_1 = require("./centerApi");
const unitxApi_1 = require("./unitxApi");
class Net {
    constructor() {
        this.runners = {};
        this.openApiColl = {};
        this.uqOpenApis = {};
        this.unitxApis = {};
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                let dbName = this.getDbName(name);
                let db = db_1.getDb(dbName);
                runner = yield this.createRunnerFromDb(name, db);
                if (runner === undefined)
                    return;
                /*
                let isExists = await db.exists();
                if (isExists === false) {
                    this.runners[name] = null;
                    return;
                }
                runner = new Runner(db);
                this.runners[name] = runner;
                */
            }
            yield runner.init();
            return runner;
        });
    }
    getUnitxRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            let name = '$unitx';
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                let db = this.getUnitxDb();
                runner = yield this.createRunnerFromDb(name, db);
                if (runner === undefined)
                    return;
                /*
                let isExists = await db.exists();
                if (isExists === false) {
                    this.runners[name] = null;
                    return;
                }
                runner = new Runner(db);
                this.runners[name] = runner;
                */
            }
            yield runner.init();
            return runner;
        });
    }
    createRunnerFromDb(name, db) {
        return __awaiter(this, void 0, void 0, function* () {
            let isExists = yield db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            let runner = new runner_1.Runner(db);
            this.runners[name] = runner;
            return runner;
        });
    }
    getOpenApi(uqFullName, unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let openApis = this.uqOpenApis[uqFullName];
            if (openApis === null)
                return null;
            if (openApis !== undefined) {
                let ret = openApis[unit];
                if (ret === null)
                    return null;
                if (ret !== undefined)
                    return ret;
            }
            else {
                this.uqOpenApis[uqFullName] = openApis = {};
            }
            let uqUrl = yield centerApi_1.centerApi.urlFromUq(unit, uqFullName);
            if (uqUrl === undefined)
                return openApis[unit] = null;
            let url = yield this.getUqUrl(uqUrl);
            url = url.toLowerCase();
            let openApi = this.openApiColl[url];
            if (openApi === undefined) {
                openApi = new openApi_1.OpenApi(url);
                this.openApiColl[url] = openApi;
            }
            openApis[unit] = openApi;
            return openApi;
        });
    }
    getUnitxApi(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = this.unitxApis[unit];
            if (unitxApi === null)
                return null;
            if (unitxApi !== undefined)
                return unitxApi;
            let unitx = yield centerApi_1.centerApi.unitx(unit);
            if (unitx === undefined)
                return this.unitxApis[unit] = null;
            let url = yield this.getUnitxUrl(unitx);
            return this.unitxApis[unit] = new unitxApi_1.UnitxApi(url);
        });
    }
    sendToUnitx(unit, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let unitxApi = yield this.getUnitxApi(unit);
            if (unitxApi === null) {
                console.log('unit %s not have unitx', unit);
                return;
            }
            let toArr = yield unitxApi.send(msg);
            return toArr;
        });
    }
    uqUrl(unit, uq) {
        return __awaiter(this, void 0, void 0, function* () {
            let uqUrl = yield centerApi_1.centerApi.uqUrl(unit, uq);
            return yield this.getUqUrl(uqUrl);
        });
    }
    getUqUrl(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            let { db, url } = urls;
            if (db_1.isDevelopment === true) {
                let urlDebug = yield this.getUrlDebug();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
            return this.getUrl(db, url);
        });
    }
    getUrlDebug() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let urlDebug = setHostUrl_1.urlSetUqHost();
                //urlDebug = urlSetUnitxHost(urlDebug);
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                return urlDebug;
            }
            catch (err) {
            }
        });
    }
    getUnitxUrl(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            let { db, url } = urls;
            if (db_1.isDevelopment === true) {
                let urlDebug = yield this.getUrlDebug();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
            return this.unitxUrl(url);
        });
    }
}
exports.Net = Net;
class ProdNet extends Net {
    getDbName(name) { return name; }
    getUnitxDb() { return db_1.getUnitxDb(false); }
    getUrl(db, url) {
        return url + 'uq/prod/' + db + '/';
    }
    unitxUrl(url) { return url + 'uq/unitx-prod/'; }
    ;
}
class TestNet extends Net {
    getDbName(name) { return name + '$test'; }
    getUnitxDb() { return db_1.getUnitxDb(true); }
    getUrl(db, url) {
        return url + 'uq/test/' + db + '/';
    }
    unitxUrl(url) { return url + 'uq/unitx-test/'; }
    ;
}
exports.prodNet = new ProdNet;
exports.testNet = new TestNet;
//# sourceMappingURL=net.js.map