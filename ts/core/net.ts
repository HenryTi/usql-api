import fetch from "node-fetch";
import { Runner } from "./runner";
import { getDb, isDevelopment, Db, getUnitxDb } from "./db";
import { OpenApi } from "./openApi";
import { urlSetUqHost } from "./setHostUrl";
import { centerApi } from "./centerApi";
import { Message } from "./model";
import { UnitxApi } from "./unitxApi";

export abstract class Net {
    private runners: {[name:string]: Runner} = {};
    private initRunner: boolean;    

    constructor(initRunner: boolean) {
        this.initRunner = initRunner;
    }

    protected async innerRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let dbName = this.getDbName(name);
            let db = getDb(dbName);
            runner = await this.createRunnerFromDb(name, db);
            if (runner === undefined) return;
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
    }

    async getRunner(name:string):Promise<Runner> {
        let runner = await this.innerRunner(name);
        if (this.initRunner === true) await runner.init();
        return runner;
    }

    async getUnitxRunner():Promise<Runner> {
        let name = '$unitx';
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {            
            let db = this.getUnitxDb();
            runner = await this.createRunnerFromDb(name, db);
            if (runner === undefined) return;
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
        await runner.init();
        return runner;
    }

    protected async createRunnerFromDb(name:string, db:Db):Promise<Runner> {
        let isExists = await db.exists();
        if (isExists === false) {
            this.runners[name] = null;
            return;
        }
        let runner = new Runner(db, this);
        this.runners[name] = runner;
        return runner;
    }

    abstract getDbName(name:string):string;
    protected abstract getUnitxDb(): Db;
    /*
    public getDb(name:string):Db {
        let dbName = this.getDbName(name);
        let db = getDb(dbName);
        return db;
    }
    */
    //private openApiColl: {[url:string]: OpenApi} = {};
    private uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
    private getOpenApiFromCache(uqFullName:string, unit:number):OpenApi {
        let openApis = this.uqOpenApis[uqFullName];
        if (openApis === null) return null;
        if (openApis !== undefined) {
            let ret = openApis[unit];
            if (ret === null) return null;
            if (ret !== undefined) return ret;
        }
        else {
            this.uqOpenApis[uqFullName] = openApis = {};
        }
        return undefined;
    }
    private async buildOpenApiFrom(uqFullName:string, unit:number, uqUrl:{db:string, url:string, urlTest:string}):Promise<OpenApi> {
        let openApis = this.uqOpenApis[uqFullName];
        //if (uqUrl === undefined) return openApis[unit] = null;
        let url = await this.getUqUrl(uqUrl);
        url = url.toLowerCase();
        /*
        let openApi = this.openApiColl[url];
        if (openApi === undefined) {
            openApi = new OpenApi(url);
            this.openApiColl[url] = openApi;
        }
        */
        let openApi = new OpenApi(url);
        openApis[unit] = openApi;
        return openApi;
    }
    async openApiUnitUq(unit:number, uqFullName:string):Promise<OpenApi> {
        let openApi = this.getOpenApiFromCache(uqFullName, unit);
        if (openApi !== undefined) return openApi;
        let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
        return await this.buildOpenApiFrom(uqFullName, unit, uqUrl);
    }

    async openApiUnitFace(unit:number, busOwner:string, busName:string, face:string):Promise<OpenApi> {
        let ret = await centerApi.unitFaceUrl(unit, busOwner, busName, face);
        if (ret === undefined) {
            throw `openApi unit face not exists: unit=${unit}, face=${busOwner}/${busName}/${face}`;
        }
        switch (ret.length) {
            case 0:
                throw 'unit-face-url return no result';
            case 1: break;
            default:
                throw 'unit-face-url return multiple results';
        }
        let uqUrl = ret[0];
        let {uq} = uqUrl;
        let openApi = this.getOpenApiFromCache(uq, unit);
        if (openApi !== undefined) return openApi;
        openApi = await this.buildOpenApiFrom(uq, unit, uqUrl);
        return openApi;
    }

    private unitxApis: {[unit:number]:UnitxApi} = {};
    async getUnitxApi(unit:number):Promise<UnitxApi> {
        let unitxApi = this.unitxApis[unit];
        if (unitxApi === null) return null;
        if (unitxApi !== undefined) return unitxApi;
        let unitx = await centerApi.unitx(unit);
        if (unitx === undefined) return this.unitxApis[unit] = null;
        let url = await this.getUnitxUrl(unitx);
        return this.unitxApis[unit] = new UnitxApi(url);
    }

    async sendToUnitx(unit:number, msg:Message):Promise<number[]> {
        let unitxApi = await this.getUnitxApi(unit);
        if (unitxApi === null) {
            console.log('unit %s not have unitx', unit);
            return;
        }
        let toArr:number[] = await unitxApi.send(msg);
        return toArr;
    }

    async uqUrl(unit:number, uq:number):Promise<string> {
        let uqUrl = await centerApi.uqUrl(unit, uq);
        return await this.getUqUrl(uqUrl);
    }

    private async getUqUrl(urls: {db:string; url:string; urlTest:string}):Promise<string> {
        let {db, url} = urls;
        if (isDevelopment === true) {
            let urlDebug = await this.getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        return this.getUrl(db, url);
    }

    protected abstract getUrl(db:string, url:string):string;

    private async getUrlDebug():Promise<string> {
        try {
            let urlDebug = urlSetUqHost();
            //urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            return urlDebug;
        }
        catch (err) {
        }
    }

    private async getUnitxUrl(urls: {db:string, url:string;}):Promise<string> {
        let {db, url} = urls;
        if (isDevelopment === true) {
            let urlDebug = await this.getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        return this.unitxUrl(url);
    }
    protected abstract unitxUrl(url:string):string;
}

class ProdNet extends Net {
    getDbName(name:string):string {return name}
    protected getUnitxDb(): Db {return getUnitxDb(false)}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/prod/' + db + '/';
    }
    protected unitxUrl(url:string):string {return url + 'uq/unitx-prod/'};
}

class TestNet extends Net {
    getDbName(name:string):string {return name + '$test'}
    protected getUnitxDb(): Db {return getUnitxDb(true)}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/test/' + db + '/';
    }
    protected unitxUrl(url:string):string {return url + 'uq/unitx-test/'};
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
export const prodNet = new ProdNet(true);
export const testNet = new TestNet(true);

// runner在编译状态下，database可能还没有创建，不需要init，也就是不需要loadSchema
export const prodCompileNet = new ProdNet(false);
export const testCompileNet = new TestNet(false);
