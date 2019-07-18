import fetch from "node-fetch";
import { Runner } from "./runner";
import { getDb } from "./db";
import { OpenApi } from "./openApi";
import { urlSetUqHost, urlSetUnitxHost } from "./setHostUrl";
import { centerApi } from "./centerApi";
import { Message } from "./model";
import { UnitxApi } from "./unitxApi";

export abstract class Net {
    private runners: {[name:string]: Runner} = {};

    async getRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let dbName = this.getDbName(name);
            let db = getDb(dbName);
            let isExists = await db.exists();
            if (isExists === false) {
                this.runners[name] = null;
                return;
            }
            runner = new Runner(db);
            this.runners[name] = runner;
        }
        await runner.init();
        return runner;
    }

    abstract getDbName(name:string):string;

    private uqOpenApis: {[uqFullName:string]: {[unit:number]:OpenApi}} = {};
    async getOpenApi(uqFullName:string, unit:number):Promise<OpenApi> {
        let openApis = this.uqOpenApis[uqFullName];
        if (openApis === null) return null;
        if (openApis !== undefined) {
            let ret = openApis[unit];
            if (ret === null) return null;
            if (ret !== undefined) return ret;
        }
        
        this.uqOpenApis[uqFullName] = openApis = {};
        let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
        if (uqUrl === undefined) return openApis[unit] = null;
        let url = await this.getUqUrl(uqUrl);
        /*
        let {url, urlDebug, urlTest} = uqUrl;
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
        */
        return openApis[unit] = new OpenApi(url);
    }

    private unitxApis: {[unit:number]:UnitxApi} = {};
    private async getUnitxApi(unit:number):Promise<UnitxApi> {
        let unitxApi = this.unitxApis[unit];
        if (unitxApi === null) return null;
        if (unitxApi !== undefined) return unitxApi;
        let unitx = await centerApi.unitx(unit);
        if (unitx === undefined) return this.unitxApis[unit] = null;
        let url = await this.getUqUrl(unitx);
        /*
        let {url, urlDebug, urlTest} = unitx;
        if (urlDebug !== undefined) {
            try {
                urlDebug = urlSetUnitxHost(urlDebug);
                let ret = await fetch(urlDebug + 'hello');
                if (ret.status !== 200) throw 'not ok';
                let text = await ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        */
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
        /*
        let {url, urlDebug, urlTest} = uqUrl;
        if (urlDebug !== undefined) {
            // 这个地方会有问题，urlDebug也许指向错误
            try {
                urlDebug = urlSetUqHost(urlDebug);
                let ret = await fetch(urlDebug + 'hello');
                if (ret.status !== 200) throw 'not ok';
                let text = await ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        return url;
        */
    }

    private async getUqUrl(urls: {db:string, url:string; urlDebug:string; urlTest:string}):Promise<string> {
        let {db, url, urlDebug, urlTest} = urls;
        if (urlDebug) {
            urlDebug = await this.getUqUrlDebug(urlDebug);
            if (urlDebug !== undefined) return urlDebug;
        }
        return this.getUrl(db, url, urlTest);
    }

    protected abstract getUrl(db:string, url:string, urlTest:string):string;

    private async getUqUrlDebug(urlDebug:string):Promise<string> {
        try {
            urlDebug = urlSetUqHost(urlDebug);
            urlDebug = urlSetUnitxHost(urlDebug);
            let ret = await fetch(urlDebug + 'hello');
            if (ret.status !== 200) throw 'not ok';
            let text = await ret.text();
            return urlDebug;
        }
        catch (err) {
        }
    }
}

class ProdNet extends Net {
    getDbName(name:string):string {return name}
    protected getUrl(db:string, url:string, urlTest:string):string {
        if (!url) url = urlTest;
        url = url.toLowerCase();
        let p = url.indexOf('/uq/');
        if (p < 0) {
            if (url.endsWith('/') === false) url += '/';
            url += 'uq/' + db + '/';
        }
        return url;
    }
}

class TestNet extends Net {
    getDbName(name:string):string {return name} // + '$test'}
    protected getUrl(db:string, url:string, urlTest:string):string {
        if (!urlTest) urlTest = url;
        urlTest = urlTest.toLowerCase();
        let p = urlTest.indexOf('/uq/');
        if (p>=0) urlTest = urlTest.substr(0, p+1);
        if (urlTest.endsWith('/') === false) urlTest += '/';
        urlTest += 'uq-test/' + db + '/';
        return urlTest;
    }
}

export const prodNet = new ProdNet;
export const testNet = new TestNet;
