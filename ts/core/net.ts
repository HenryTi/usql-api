import fetch from "node-fetch";
import { EntityRunner } from "./runner";
import { Db, env, UnitxDb } from "./db";
import { OpenApi } from "./openApi";
import { centerApi } from "./centerApi";
import { Message } from "./model";
import { UnitxApi } from "./unitxApi";

interface UnitxApis {
	[direction: string]: UnitxApi;
}

export abstract class Net {
    private readonly id:string;
    private runners: {[name:string]: EntityRunner} = {};
	private executingNet: Net;  // 编译Net指向对应的执行Net，编译完成后，reset runner
	protected unitxDb: UnitxDb;

    constructor(executingNet: Net, id:string) {
        this.executingNet = executingNet;
		this.id = id;
		this.buildUnitxDb();
    }

    protected abstract buildUnitxDb():void;
    abstract getUqFullName(uq:string):string;

    protected async innerRunner(name:string):Promise<EntityRunner> {
        name = name.toLowerCase();
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {
            let dbName = this.getDbName(name);
            let db = Db.db(dbName);
            runner = await this.createRunnerFromDb(name, db);
            if (runner === undefined) return;
        }
        return runner;
    }

    async getRunner(name:string):Promise<EntityRunner> {
        let runner = await this.innerRunner(name);
        if (runner === undefined) return;
        // 执行版的net，this.execeutingNet undefined，所以需要init
        if (this.executingNet === undefined) {
            await runner.init();
        }
        return runner;
    }

	async runnerCompiling(db:Db) {
		for (let i in this.runners) {
			let runner: EntityRunner = this.runners[i];
			if (!runner) continue;
			if (runner.equDb(db) === true) runner.isCompiling = true;
		}
	}

    async resetRunnerAfterCompile(db:Db) {
		let runners:EntityRunner[] = [];
		for (let i in this.runners) {
			let runner: EntityRunner = this.runners[i];
			if (!runner) continue;
			if (runner.equDb(db) === true) runners.push(runner);
		}

		for (let runner of runners) {
			await runner.buildTuidAutoId();
			await this.resetRunner(runner);
			console.error('=== resetRunnerAfterCompile: ' + runner.name);
		}

		if (this.executingNet !== undefined) {
			this.executingNet.resetRunnerAfterCompile(db);
			console.error('=== executingNet resetRunnerAfterCompile: ' + db.getDbName());
		}
	}

    private async resetRunner(runner: EntityRunner) {
        let runnerName = runner.name;
        for (let i in this.runners) {
            if (i !== runnerName) continue;
            let runner = this.runners[i];
            if (runner) {
				await runner.reset();
                console.error('--- === --- === ' + runnerName + ' resetRunner ' + ' net is ' + this.id);
                this.runners[i] = undefined;
            }
        }
    }

    async getUnitxRunner():Promise<EntityRunner> {
        let name = '$unitx';
        let runner = this.runners[name];
        if (runner === null) return;
        if (runner === undefined) {            
            runner = await this.createRunnerFromDb(name, this.unitxDb);
            if (runner === undefined) return;
        }
        // 执行版的net，this.execeutingNet undefined，所以需要init
        if (this.executingNet === undefined) {
            await runner.init();
        }
        return runner;
    }

    private createRunnerFromDbPromises: {[name:string]: {resolve: (value?: any) => void, reject: (reason?: any) => void}[]} = {};
    protected async createRunnerFromDb(name:string, db:Db):Promise<EntityRunner> {
        return await new Promise<EntityRunner>((resolve, reject) => {
            let promiseArr = this.createRunnerFromDbPromises[name];
            if (promiseArr !== undefined) {
                promiseArr.push({resolve, reject});
                return;
            }
            this.createRunnerFromDbPromises[name] = promiseArr =[{resolve, reject}];
            db.exists().then(isExists => {
                let runner: EntityRunner;
                if (isExists === false) {
                    //console.error('??? === ??? === ' + name + ' not exists in new Runner');
                    this.runners[name] = null;
                    runner = undefined;
                }
                else {
                    //console.error('+++ === +++ === ' + name + ' new Runner(name, db, this)');
                    runner = new EntityRunner(name, db, this);
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
    }

    abstract getDbName(name:string):string;

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
        let url = await this.getUqUrlOrDebug(uqUrl);
        url = url.toLowerCase();
        let openApi = new OpenApi(url);
        openApis[unit] = openApi;
        return openApi;
    }
    async openApiUnitUq(unit:number, uqFullName:string):Promise<OpenApi> {
		let openApi = this.getOpenApiFromCache(uqFullName, unit);
		if (openApi === null) {
			console.error('openApiUnitUq null ', uqFullName, unit);
			return null;
		}
		if (openApi !== undefined) return openApi;
		let uqUrl = await centerApi.urlFromUq(unit, uqFullName);
		if (!uqUrl) {
			console.error('openApiUnitUq centerApi.urlFromUq not exists', uqFullName, unit);
			let openApis = this.uqOpenApis[uqFullName];
			if (openApis) {
				openApis[unit] = null;
			}
			return null;
		}
		return await this.buildOpenApiFrom(uqFullName, unit, uqUrl);
    }

    async openApiUnitFace(unit:number, busOwner:string, busName:string, face:string):Promise<OpenApi> {
        let ret = await centerApi.unitFaceUrl(unit, busOwner, busName, face);
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
        let {uq} = uqUrl;
        let openApi = this.getOpenApiFromCache(uq, unit);
        if (openApi !== undefined) return openApi;
        openApi = await this.buildOpenApiFrom(uq, unit, uqUrl);
        return openApi;
    }

    private unitxApisColl: {[unit:number]:UnitxApis} = {};
    async getUnitxApi(unit:number, direction: 'push'|'pull'):Promise<UnitxApi> {
		try {
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
		}
		catch (err) {
			console.error('getUnitxApi', err);
		}
	}
	
    async sendToUnitx(unit:number, msg:Message):Promise<number[]|string> {
        let unitxApi = await this.getUnitxApi(unit, 'push');
        if (!unitxApi) {
            let err = `Center unit ${unit} not binding $unitx service!!!`;
            //return ret;
            console.error(err);
            throw new Error(err);
        }
        let toArr:number[] = await unitxApi.send(msg);
        return toArr;
    }

    async uqUrl(unit:number, uq:number):Promise<string> {
        let uqUrl = await centerApi.uqUrl(unit, uq);
        return await this.getUqUrlOrDebug(uqUrl);
    }

    private async getUqUrlOrDebug(urls: {db:string; url:string; urlTest:string}):Promise<string> {
        let url:string;
        let {db} = urls;
        if (env.isDevelopment === true) {
            let urlDebug = await this.getUrlDebug();
            if (urlDebug !== undefined) url = urlDebug;
        }
        else {
            url = this.chooseUrl(urls);
        }
        return this.getUrl(db, url);
    }

    protected abstract getUrl(db:string, url:string):string;
    protected abstract chooseUrl(urls: {url:string; urlTest:string}):string;

	static urlDebugPromises:{[url:string]: Promise<string>|boolean} = {};
    private async getUrlDebug():Promise<string> {
		let urlDebug = `http://${env.localhost}/`; //urlSetUqHost();
		let urlDebugPromise = Net.urlDebugPromises[urlDebug];
		if (urlDebugPromise === true) return urlDebug;
		if (urlDebugPromise === false) return undefined;
		if (urlDebugPromise === undefined) {
			urlDebugPromise = this.fetchHello(urlDebug);
			Net.urlDebugPromises[urlDebug] = urlDebugPromise;
		}
		let ret = await urlDebugPromise;
		if (ret === null) {
			Net.urlDebugPromises[urlDebug] = false;
			return undefined;
		}
		else {
			Net.urlDebugPromises[urlDebug] = true;
			return ret;
		}

	}
	
	private async fetchHello(url:string):Promise<string> {
		try {
			let ret = await fetch(url + 'hello');
			if (ret.status !== 200) throw 'not ok';
			let text = await ret.text();
			return url;
		}
		catch {
			return null;
		}
}

    private async getUnitxUrl(urls: {url:string; server:number; urlTest:string; serverTest:number}):Promise<string> {
		let ret = this.getFromUrls(urls);
		let {url, server} = ret;
        if (env.isDevelopment === true) {
			if (server === this.unitxDb.serverId) {
				let urlDebug = await this.getUrlDebug();
				if (urlDebug !== undefined) url = urlDebug;
			}
        }
        return this.unitxUrl(url);
    }
	protected abstract unitxUrl(url:string):string;
	protected abstract getFromUrls(urls: {url:string; server:number; urlTest:string; serverTest:number}):{url:string;server:number};
}

class ProdNet extends Net {
	protected buildUnitxDb():void {this.unitxDb = Db.unitxProdDb();}
	getDbName(name:string):string {return name}
    getUqFullName(uq:string):string {return uq}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/prod/' + db + '/';
    }
    protected chooseUrl(urls: {url:string; urlTest:string}):string {return urls.url}
    protected unitxUrl(url:string):string {return url + 'uq/unitx-prod/'};
	protected getFromUrls(urls: {url:string; server:number; urlTest:string; serverTest:number}):{url:string;server:number} {
		let {url, server} = urls;
		return {url, server};
	}
}

class TestNet extends Net {
	protected buildUnitxDb():void {this.unitxDb = Db.unitxTestDb();}
    getDbName(name:string):string {return name + '$test'}
    getUqFullName(uq:string):string {return uq + '$test'}
    protected getUrl(db:string, url:string):string {
        return url + 'uq/test/' + db + '/';
    }
    protected chooseUrl(urls: {url:string; urlTest:string}):string {return urls.urlTest}
    protected unitxUrl(url:string):string {return url + 'uq/unitx-test/'};
	protected getFromUrls(urls: {url:string; server:number; urlTest:string; serverTest:number}):{url:string;server:number} {
		let {urlTest, serverTest} = urls;
		return {url:urlTest, server:serverTest};
	}
}

// 在entity正常状态下，每个runner都需要init，loadSchema
export const prodNet = new ProdNet(undefined, 'prodNet');
export const testNet = new TestNet(undefined, 'testNet');

// runner在编译状态下，database可能还没有创建，不需要init，也就是不需要loadSchema
export const prodCompileNet = new ProdNet(prodNet, 'prodCompileNet');
export const testCompileNet = new TestNet(testNet, 'testCompileNet');
