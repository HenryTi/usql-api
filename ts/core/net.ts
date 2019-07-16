import fetch from "node-fetch";
import { Runner } from "./runner";
import { getDb } from "./db";
import { OpenApi } from "./openApi";
import { urlSetUqHost, urlSetUnitxHost } from "./setHostUrl";
import { centerApi } from "./centerApi";
import { Fetch } from "./fetch";
import { Message } from "./model";
import { UnitxApi } from "./unitxApi";

export abstract class Net {
    private runners: {[name:string]: Runner} = {};

    async getRunner(name:string):Promise<Runner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let db = getDb(name);
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
        let {url, urlDebug} = uqUrl;
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
        return openApis[unit] = new OpenApi(url);
    }

    private unitxApis: {[unit:number]:UnitxApi} = {};
    private async getUnitxApi(unit:number):Promise<UnitxApi> {
        let unitxApi = this.unitxApis[unit];
        if (unitxApi === null) return null;
        if (unitxApi !== undefined) return unitxApi;
        let unitx = await centerApi.unitx(unit);
        if (unitx === undefined) return this.unitxApis[unit] = null;
        let {url, urlDebug} = unitx;
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
}

class ProdNet extends Net {
}

class TestNet extends Net {
}

export const prodNet = new ProdNet;
export const testNet = new TestNet;
