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
    constructor(initRunner) {
        this.runners = {};
        /*
        public getDb(name:string):Db {
            let dbName = this.getDbName(name);
            let db = getDb(dbName);
            return db;
        }
        */
        //private openApiColl: {[url:string]: OpenApi} = {};
        this.uqOpenApis = {};
        this.unitxApis = {};
        this.initRunner = initRunner;
    }
    innerRunner(name) {
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
            return runner;
        });
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.innerRunner(name);
            if (runner === undefined)
                return;
            if (this.initRunner === true)
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
            let runner = new runner_1.Runner(db, this);
            this.runners[name] = runner;
            return runner;
        });
    }
    getOpenApiFromCache(uqFullName, unit) {
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
        return undefined;
    }
    buildOpenApiFrom(uqFullName, unit, uqUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            let openApis = this.uqOpenApis[uqFullName];
            let url = yield this.getUqUrlOrDebug(uqUrl);
            url = url.toLowerCase();
            let openApi = new openApi_1.OpenApi(url);
            openApis[unit] = openApi;
            return openApi;
        });
    }
    openApiUnitUq(unit, uqFullName) {
        return __awaiter(this, void 0, void 0, function* () {
            let openApi = this.getOpenApiFromCache(uqFullName, unit);
            if (openApi !== undefined)
                return openApi;
            let uqUrl = yield centerApi_1.centerApi.urlFromUq(unit, uqFullName);
            if (!uqUrl)
                return;
            return yield this.buildOpenApiFrom(uqFullName, unit, uqUrl);
        });
    }
    openApiUnitFace(unit, busOwner, busName, face) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield centerApi_1.centerApi.unitFaceUrl(unit, busOwner, busName, face);
            if (ret === undefined) {
                throw `openApi unit face not exists: unit=${unit}, face=${busOwner}/${busName}/${face}`;
            }
            switch (ret.length) {
                case 0:
                    throw `unit-face-url return no result unit=${unit} bus=${busOwner}/${busName}/${face}`;
                case 1: break;
                default:
                    throw `unit-face-url return multiple results unit=${unit} bus=${busOwner}/${busName}/${face}`;
            }
            let uqUrl = ret[0];
            let { uq } = uqUrl;
            let openApi = this.getOpenApiFromCache(uq, unit);
            if (openApi !== undefined)
                return openApi;
            openApi = yield this.buildOpenApiFrom(uq, unit, uqUrl);
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
            return yield this.getUqUrlOrDebug(uqUrl);
        });
    }
    getUqUrlOrDebug(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            let url;
            let { db } = urls;
            if (db_1.isDevelopment === true) {
                let urlDebug = yield this.getUrlDebug();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
            else {
                url = this.chooseUrl(urls);
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
    get isTest() { return false; }
    getDbName(name) { return name; }
    getUqFullName(uq) { return uq; }
    getUnitxDb() { return db_1.getUnitxDb(false); }
    getUrl(db, url) {
        return url + 'uq/prod/' + db + '/';
    }
    chooseUrl(urls) { return urls.url; }
    unitxUrl(url) { return url + 'uq/unitx-prod/'; }
    ;
}
class TestNet extends Net {
    get isTest() { return true; }
    getDbName(name) { return name + '$test'; }
    getUqFullName(uq) { return uq + '$test'; }
    getUnitxDb() { return db_1.getUnitxDb(true); }
    getUrl(db, url) {
        return url + 'uq/test/' + db + '/';
    }
    chooseUrl(urls) { return urls.urlTest; }
    unitxUrl(url) { return url + 'uq/unitx-test/'; }
    ;
}
/*
class ProdCompileNet extends ProdNet {
    async getRunner(name:string):Promise<Runner> {
        let runner = await this.innerRunner(name);
        return runner;
    }
}

class TestCompileNet extends TestNet {
    async getRunner(name:string):Promise<Runner> {
        let runner = await this.innerRunner(name);
        return runner;
    }
}
*/
// 在entity正常状态下，每个runner都需要init，loadSchema
exports.prodNet = new ProdNet(true);
exports.testNet = new TestNet(true);
// runner在编译状态下，database可能还没有创建，不需要init，也就是不需要loadSchema
exports.prodCompileNet = new ProdNet(false);
exports.testCompileNet = new TestNet(false);
//# sourceMappingURL=net.js.map