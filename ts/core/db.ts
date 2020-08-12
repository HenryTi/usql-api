import * as config from 'config';
import * as _ from 'lodash';
import {DbServer} from './dbServer';
import {MsDbServer} from './ms';
import {MyDbServer} from './my';
import { EntityRunner } from './runner';

/*

function isNodeEnvEqu(...envs:string[]):boolean {
	let nodeEnv = process.env.NODE_ENV as string;
	if (!nodeEnv) return false;
	let e = nodeEnv.toLowerCase();
	return envs.findIndex(v => v === e) >= 0;
}

export const isDevelopment:boolean = isNodeEnvEqu(const_development);
export const isDevdo:boolean = isNodeEnvEqu(const_devdo);
export const isDev = isNodeEnvEqu(const_development, const_devdo);
*/
class Env {
	private static const_connectionUnitx = 'connection_$unitx';
	private static const_connection = 'connection';
	private static const_development = 'development';
	private static const_devdo = 'devdo';

	readonly isDevelopment: boolean = false;
	readonly isDevdo: boolean = false;
	readonly const_unitx = '$unitx';

	constructor() {
		let nodeEnv = process.env.NODE_ENV as string;
		if (!nodeEnv) return;
		switch (nodeEnv.toLowerCase()) {
			case Env.const_development: 
				this.isDevelopment = true; 
				break;
			case Env.const_devdo: 
				this.isDevdo = true; 
				break;
		}
	}

	getUnitxConnection():any {
        if (config.has(Env.const_connectionUnitx) === true) {
            return config.get<any>(Env.const_connectionUnitx);
        }
        throw `server '${config.get<string>('servername')}' has no connection_$unitx defined in config.json`;
	}

	getConnection():any {
		if (config.has(Env.const_connection) === true) {
			return _.clone(config.get<any>(Env.const_connection));
		}
		throw `server '${config.get<string>('servername')}' has no connection defined in config.json`;
	}


}

export const env = new Env();

export class Db {
	private static dbs:{[name:string]:Db} = {
	}
	// 数据库名称对照表
	private static dbCollection:{[name:string]:string} = {}
	/*(function () {
		const dbColl = "db";
		if (!config.has(dbColl)) return {};
		return config.get<any>(dbColl);
	})();*/
	/*
	private static getDb(name:string):Db {
		let db = Db.dbs[name]; //.getCacheDb(name);
		if (db !== undefined) return db;
		let dbName = Db.getDbName(name);
		db = new Db(dbName);
		return Db.dbs[name] = db;
	}*/
	
	/*
	private static getUnitxDb(testing:boolean):Db {
		let name = const_unitx;
		if (testing === true) name += '$test';
		let db = Db.dbs[name]; //.getCacheDb(name);
		if (db !== undefined) return db;
		let dbName = Db.getDbName(name);
		return Db.dbs[name] = new UnitxDb(dbName);
	}*/
	
	private static getDbName(name:string): string {
		return Db.dbCollection[name] || name;
	}
	
	/*
	private static getCacheDb(name:string):Db {
		return Db.dbs[name];
	}*/
	
	static db(name:string):Db {
		name = name || $uq;
		let db = Db.dbs[name]; //.getCacheDb(name);
		if (db !== undefined) return db;
		let dbName = Db.getDbName(name);
		db = new Db(dbName);
		return Db.dbs[name] = db;
	}

	static unitxDb(testing:boolean):Db {
		let name = env.const_unitx;
		if (testing === true) name += '$test';
		let db = Db.dbs[name]; // getCacheDb(name);
		if (db !== undefined) return db;
		let dbName = Db.getDbName(name);
		return Db.dbs[name] = new UnitxDb(dbName);
	}

    private dbName: string;
    private isExists: boolean;
    private dbServer:DbServer;

    protected constructor(dbName: string) {
        this.dbName = dbName;
        this.dbServer = this.createDbServer();
        this.isExists = false;
	}

	reset() {
		this.dbServer.reset();
	}

    getDbName():string {return this.dbName}
    protected getDbConfig() {
		//let ret = _.clone(config.get<any>(const_connection));
		let ret = env.getConnection();
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
    private createDbServer() {
        let sqlType = config.get<string>('sqlType');
        let dbConfig:any = this.getDbConfig();
        if (dbConfig === undefined) throw 'dbConfig not defined';
        switch (sqlType) {
            case 'mysql': return new MyDbServer(this.dbName, dbConfig);
            case 'mssql': return new MsDbServer(this.dbName, dbConfig);
        }
    }

    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return this.isExists = await this.dbServer.existsDatabase(this.dbName);
    }
    async buildTuidAutoId(): Promise<void> {
        await this.dbServer.buildTuidAutoId(this.dbName);
    }
    async log(unit:number, uq:string, subject:string, content:string):Promise<void> {
        return await this.dbServer.call('$uq', 'log', [unit, uq, subject, content]);
    }
    async logPerformance(tick:number, log:string, ms:number):Promise<void> {
        try {
            await this.dbServer.call('$uq', 'performance', [tick, log, ms]);
        }
        catch (err) {
            console.error(err);
            let {message, sqlMessage} = err;
            let msg = '';
            if (message) msg += message;
            if (sqlMessage) msg += ' ' + sqlMessage;
            await this.dbServer.call('$uq', 'performance', [Date.now(), msg, 0]);
        }
	}
	async createProcObjs():Promise<void> {
		await this.dbServer.createProcObjs(this.dbName);
	}
    async sql(sql:string, params:any[]): Promise<any> {
        //this.devLog('sql', params);
        return await this.dbServer.sql(this.dbName, sql, params);
    }
    async sqlDropProc(procName:string): Promise<any> {
        return await this.dbServer.sqlDropProc(this.dbName, procName);
    }
    async sqlProc(procName:string, procSql:string): Promise<any> {
        return await this.dbServer.sqlProc(this.dbName, procName, procSql);
    }
    async buildProc(procName:string, procSql:string): Promise<void> {
        await this.dbServer.buildProc(this.dbName, procName, procSql);
	}
	async call(proc:string, params:any[]): Promise<any> {
        //this.devLog(proc, params);
        return await this.dbServer.call(this.dbName, proc, params);
    }
    async callEx(proc:string, params:any[]): Promise<any> {
        //this.devLog(proc, params);
        return await this.dbServer.callEx(this.dbName, proc, params);
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        //this.devLog(proc, params);
        return await this.dbServer.tableFromProc(this.dbName, proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        //this.devLog(proc, params);
        return await this.dbServer.tablesFromProc(this.dbName, proc, params);
    }
    async createDatabase(): Promise<void> {
        return await this.dbServer.createDatabase(this.dbName);
    }
    async buildDatabase(): Promise<boolean> {
        return await this.dbServer.buildDatabase(this.dbName);
    }
    async setDebugJobs():Promise<void> {
        await this.dbServer.setDebugJobs();
    }
    async uqDbs():Promise<any[]> {
        return await this.dbServer.uqDbs();
    }

    async createResDb(resDbName:string):Promise<void> {
        await this.dbServer.createResDb(resDbName);
    }
    async create$UqDb():Promise<void> {
        await this.dbServer.create$UqDb();
    }
}

class UnitxDb extends Db {
    protected getDbConfig() { return env.getUnitxConnection() }
}

export class SpanLog {
    private logger: DbLogger
    private readonly _log: string;
    readonly tick: number;
    tries: number;
    error: string;
    private _ms: number;
    constructor(logger:DbLogger, log:string) {
        this.logger = logger;
        if (log) {
            if (log.length > 2048) log = log.substr(0, 2048);
        }
        this._log = log;
        this.tick = Date.now();
        this.tries = 0;
    }

    close() {
        this._ms = Date.now() - this.tick;
        this.logger.add(this);
    }

    get ms() {return this._ms}
    get log(): string {
        if (this.error !== undefined) {
            return `${this._log} RETRY:${this.tries} ERR:${this.error}`;
        }
        if (this.tries > 0) {
            return `${this._log} RETRY:${this.tries}`;
        }
        return this._log;
    }
}

const $uq = '$uq';

export async function create$UqDb() {
	let db = Db.db($uq);
    let runner = new EntityRunner($uq, db);
    await runner.create$UqDb();
}

const tSep = '\r';
const nSep = '\r\r';
class DbLogger {
    private db: Db;
    private minSpan:number; // 10ms
    private tick:number = Date.now();
    private spans:SpanLog[] = [];

    constructor(minSpan:number = 0) {
        this.minSpan = minSpan;
    }

    async open(log:string): Promise<SpanLog> {
		if (this.db === undefined) {
			this.db = Db.db(undefined);
		}
        return new SpanLog(this, log);
    }

    add(span: SpanLog) {
        let {ms: count, log} = span;
        if (count >= this.minSpan) {
            this.spans.push(span);
        }
        let len = this.spans.length;
        if (len === 0) return;
        let tick = Date.now();
        if (len > 10 || tick - this.tick > 10*1000) {
            this.tick = tick;
            let spans = this.spans;
            this.spans = [];
            this.save(spans);
        }
    }

    private save(spans: SpanLog[]):void {
        for (let span of spans) {
            let now = Date.now();
            let {log, tick, ms} = span;
            if (ms === undefined || ms < 0 || ms > 1000000) {
                debugger;
            }
            if (tick > now || tick < now - 1000000) {
                //debugger;
            }
            this.db.logPerformance(tick, log, ms);
        }
    }
}

export const dbLogger = new DbLogger();
