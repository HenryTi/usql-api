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
interface ConfigDebugging {
	"unitx": {
		test: string; 
		prod: string;
	};
	"uq-api": string, 
}

class Env {
	private static const_connection = 'connection';
	private static const_development = 'development';
	private static const_devdo = 'devdo';

	readonly isDevelopment: boolean = false;
	readonly isDevdo: boolean = false;
	readonly configDebugging: ConfigDebugging;
	readonly configServers: {[name:string]: any};
	readonly localhost: string;

	constructor() {
		let nodeEnv = process.env.NODE_ENV as string;
		if (!nodeEnv) return;
		switch (nodeEnv.toLowerCase()) {
			case Env.const_development: 
				this.isDevelopment = true; 
				this.configDebugging = config.get('debugging');
				this.localhost = 'localhost:' + config.get('port');
				this.configServers = config.get('servers');
				break;
			case Env.const_devdo: 
				this.isDevdo = true; 
				break;
		}
	}

	private conn: any;
	getConnection():any {
		if (this.conn) return this.conn;
		let conn:any;
		if (this.isDevelopment === true) {
			let uqApi = this.configDebugging?.['uq-api'];
			if (uqApi) {
				conn = this.configServers?.[uqApi];
			}
		}

		if (!conn) {
			if (config.has(Env.const_connection) === true) {
				conn = config.get<any>(Env.const_connection);
			}
		}
		if (!conn) {
			throw `connection need to be defined in config.json`;
		}
		return this.conn = _.clone(conn);
	}
}

export const env = new Env();

export abstract class Db {
	private static dbs:{[name:string]:Db} = {
	}
	/*
	// 数据库名称对照表
	private static dbCollection:{[name:string]:string} = {}
	
	private static getDbName(name:string): string {
		return Db.dbCollection[name] || name;
	}
	*/
	static db(name:string):Db {
		let db = Db.dbs[name]; //.getCacheDb(name);
		if (db !== undefined) return db;
		let dbName = name; // Db.getDbName(name);
		db = new UqDb(dbName);
		return Db.dbs[name] = db;
	}

    private dbName: string;
    private isExists: boolean = false;
	protected dbServer: DbServer;
	serverId: number;
	isTesting: boolean;

	constructor(dbName: string) {
		this.dbName = dbName;
		this.dbServer = this.createDbServer();
	}

    getDbName():string {return this.dbName}
    protected abstract getDbConfig():any;
    protected createDbServer() {
        let sqlType = config.get<string>('sqlType');
        let dbConfig = this.getDbConfig();
        if (dbConfig === undefined) throw 'dbConfig not defined';
		this.serverId = dbConfig['server-id'];
        switch (sqlType) {
            case 'mysql': return new MyDbServer(this.dbName, dbConfig);
            case 'mssql': return new MsDbServer(this.dbName, dbConfig);
        }
    }

	reset() {
		this.dbServer.reset();
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
    async sqlDropProc(procName:string, isFunc:boolean): Promise<any> {
        return await this.dbServer.sqlDropProc(this.dbName, procName, isFunc);
    }
    async sqlProc(procName:string, procSql:string): Promise<any> {
        return await this.dbServer.sqlProc(this.dbName, procName, procSql);
    }
    async buildProc(procName:string, procSql:string, isFunc:boolean): Promise<void> {
        await this.dbServer.buildProc(this.dbName, procName, procSql, isFunc);
	}
	async buildRealProcFrom$ProcTable(proc:string): Promise<void> {
		await this.dbServer.buildRealProcFrom$ProcTable(this.dbName, proc);
	}
	async call(proc:string, params:any[]): Promise<any> {
        return await this.dbServer.call(this.dbName, proc, params);
    }
    async callEx(proc:string, params:any[]): Promise<any> {
        return await this.dbServer.callEx(this.dbName, proc, params);
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        return await this.dbServer.tableFromProc(this.dbName, proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
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

export class UqDb extends Db {
	protected getDbConfig() {
		let ret = env.getConnection();
        ret.flags = '-FOUND_ROWS';
        return ret;
    }
}

export abstract class UnitxDb extends Db {
	protected getDbConfig() {
		let ret = this.getUnitxConnection();
        return ret;
	}
	
	private unitxConn: any;
	getUnitxConnection():any {
		if (this.unitxConn) return this.unitxConn;
		let conn:any;
		if (env.isDevelopment === true) {
			let unitx = env.configDebugging?.['unitx'];
			if (unitx) {
				let debugConfigName = this.getDebugConfigName(unitx);
				if (debugConfigName) {
					conn = env.configServers?.[debugConfigName];
				}
			}
		}
		if (!conn) {
			conn = env.getConnection();
		}
		return this.unitxConn = _.clone(conn);
	}

	protected abstract getDebugConfigName(unitx:any):string;
}

export class UnitxProdDb extends UnitxDb {
	protected getDebugConfigName(unitx:any):string {return unitx.prod}
}

export class UnitxTestDb extends UnitxDb {
	protected getDebugConfigName(unitx:any):string {return unitx.test}
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
