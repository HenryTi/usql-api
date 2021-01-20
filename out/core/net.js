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
exports.testCompileNet = exports.prodCompileNet = exports.testNet = exports.prodNet = exports.Net = void 0;
const runner_1 = require("./runner");
const db_1 = require("./db");
const openApi_1 = require("./openApi");
const centerApi_1 = require("./centerApi");
const getUrlDebug_1 = require("./getUrlDebug");
const unitx_1 = require("./unitx");
class Net {
    constructor(executingNet, id) {
        this.runners = {};
        this.createRunnerFromDbPromises = {};
        this.uqOpenApis = {};
        this.executingNet = executingNet;
        this.id = id;
        this.buildUnitx();
    }
    innerRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = name.toLowerCase();
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                let dbName = this.getDbName(name);
                let db = db_1.Db.db(dbName);
                db.isTesting = this.isTesting;
                runner = yield this.createRunnerFromDb(name, db);
                if (runner === undefined)
                    return;
            }
            return runner;
        });
    }
    getRunner(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let runner = yield this.innerRunner(name);
            if (runner === undefined)
                return;
            // 执行版的net，this.execeutingNet undefined，所以需要init
            if (this.executingNet === undefined) {
                yield runner.init();
            }
            return runner;
        });
    }
    runnerCompiling(db) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i in this.runners) {
                let runner = this.runners[i];
                if (!runner)
                    continue;
                if (runner.equDb(db) === true)
                    runner.isCompiling = true;
            }
        });
    }
    resetRunnerAfterCompile(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let runners = [];
            for (let i in this.runners) {
                let runner = this.runners[i];
                if (!runner)
                    continue;
                if (runner.equDb(db) === true)
                    runners.push(runner);
            }
            for (let runner of runners) {
                yield runner.buildTuidAutoId();
                yield this.resetRunner(runner);
                console.error('=== resetRunnerAfterCompile: ' + runner.name);
            }
            if (this.executingNet !== undefined) {
                this.executingNet.resetRunnerAfterCompile(db);
                console.error('=== executingNet resetRunnerAfterCompile: ' + db.getDbName());
            }
        });
    }
    resetRunner(runner) {
        return __awaiter(this, void 0, void 0, function* () {
            let runnerName = runner.name;
            for (let i in this.runners) {
                if (i !== runnerName)
                    continue;
                let runner = this.runners[i];
                if (runner) {
                    yield runner.reset();
                    console.error('--- === --- === ' + runnerName + ' resetRunner ' + ' net is ' + this.id);
                    this.runners[i] = undefined;
                }
            }
        });
    }
    getUnitxRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            let name = '$unitx';
            let runner = this.runners[name];
            if (runner === null)
                return;
            if (runner === undefined) {
                runner = yield this.createRunnerFromDb(name, this.unitx.db);
                if (runner === undefined)
                    return;
            }
            // 执行版的net，this.execeutingNet undefined，所以需要init
            if (this.executingNet === undefined) {
                yield runner.init();
            }
            return runner;
        });
    }
    createRunnerFromDb(name, db) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                let promiseArr = this.createRunnerFromDbPromises[name];
                if (promiseArr !== undefined) {
                    promiseArr.push({ resolve, reject });
                    return;
                }
                this.createRunnerFromDbPromises[name] = promiseArr = [{ resolve, reject }];
                db.exists().then(isExists => {
                    let runner;
                    if (isExists === false) {
                        //console.error('??? === ??? === ' + name + ' not exists in new Runner');
                        this.runners[name] = null;
                        runner = undefined;
                    }
                    else {
                        //console.error('+++ === +++ === ' + name + ' new Runner(name, db, this)');
                        runner = new runner_1.EntityRunner(name, db, this);
                        this.runners[name] = runner;
                    }
                    for (let promiseItem of this.createRunnerFromDbPromises[name]) {
                        promiseItem.resolve(runner);
                    }
                    this.createRunnerFromDbPromises[name] = undefined;
                }).catch(reason => {
                    for (let promiseItem of this.createRunnerFromDbPromises[name]) {
                        promiseItem.reject(reason);
                    }
                    this.createRunnerFromDbPromises[name] = undefined;
                });
            });
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
            if (openApi === null) {
                console.error('openApiUnitUq null ', uqFullName, unit);
                return null;
            }
            if (openApi !== undefined)
                return openApi;
            let uqUrl = yield centerApi_1.centerApi.urlFromUq(unit, uqFullName);
            if (!uqUrl) {
                console.error('openApiUnitUq centerApi.urlFromUq not exists', uqFullName, unit);
                let openApis = this.uqOpenApis[uqFullName];
                if (openApis) {
                    openApis[unit] = null;
                }
                return null;
            }
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
                    throw `no bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
                case 1: break;
                default:
                    throw `multiple bus-query for unit=${unit} bus=${busOwner}/${busName}/${face}`;
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
    // private unitxApisColl: {[unit:number]:UnitxApis} = {};
    //async getUnitxApi(unit:number, direction: 'push'|'pull'):Promise<UnitxApi> {
    //	return await this.unitx.getUnitxApi(unit, direction);
    /*
    let unitxApis = this.unitxApisColl[unit];
    if (unitxApis === undefined) {
        this.unitxApisColl[unit] = unitxApis = {};
    }
    let unitxApi = unitxApis[direction];
    if (unitxApi === null) return null;
    if (unitxApi !== undefined) return unitxApi;

    let unitx = await centerApi.unitx(unit, direction);
    if (unitx === undefined) {
        return unitxApis[direction] = null;
    }
    let url = await this.getUnitxUrl(unitx);
    return unitxApis[direction] = new UnitxApi(url);
    */
    //}
    sendToUnitx(unit, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitx.sendToUnitx(unit, msg);
            /*
            console.error('sendToUnitx', unit, msg);
            let unitxApi = await this.getUnitxApi(unit, 'push');
            if (!unitxApi) {
                let err = `Center unit ${unit} not binding $unitx service!!!`;
                //return ret;
                console.error(err);
                throw new Error(err);
            }
            else {
                console.error('get unitx push url in sendToUnitx: ',  unitxApi.url);
            }
            let toArr:number[] = await unitxApi.send(msg);
            return toArr;
            */
        });
    }
    pullBus(unit, maxId, faces) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitx.pullBus(unit, maxId, faces);
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
            if (db_1.env.isDevelopment === true) {
                let urlDebug = yield getUrlDebug_1.getUrlDebug();
                if (urlDebug !== undefined)
                    url = urlDebug;
            }
            else {
                url = this.chooseUrl(urls);
            }
            return this.getUrl(db, url);
        });
    }
}
exports.Net = Net;
class ProdNet extends Net {
    buildUnitx() { this.unitx = new unitx_1.UnitxProd(); }
    get isTesting() { return false; }
    getDbName(name) { return name; }
    getUqFullName(uq) { return uq; }
    getUrl(db, url) {
        return url + 'uq/prod/' + db + '/';
    }
    chooseUrl(urls) { return urls.url; }
}
class TestNet extends Net {
    buildUnitx() { this.unitx = new unitx_1.UnitxTest(); }
    get isTesting() { return false; }
    getDbName(name) { return name + '$test'; }
    getUqFullName(uq) { return uq + '$test'; }
    getUrl(db, url) {
        return url + 'uq/test/' + db + '/';
    }
    chooseUrl(urls) { return urls.urlTest; }
}
// 在entity正常状态下，每个runner都需要init，loadSchema
exports.prodNet = new ProdNet(undefined, 'prodNet');
exports.testNet = new TestNet(undefined, 'testNet');
// runner在编译状态下，database可能还没有创建，不需要init，也就是不需要loadSchema
exports.prodCompileNet = new ProdNet(exports.prodNet, 'prodCompileNet');
exports.testCompileNet = new TestNet(exports.testNet, 'testCompileNet');
//# sourceMappingURL=net.js.map