import { Builder } from "./builder";

export interface ParamPage {
	start:number;
	size:number;
}

export interface TableSchema {
	db: string;
	name: string;
	type: string;
	keys: {name:string}[];
	fields: {name:string}[];
	values: any[];
}

export interface ParamIDActs {
	[ID:string]: TableSchema;
}

export interface ParamIDDetail {
	ID: TableSchema;
	IDDetail: TableSchema;
	IDDetail2?: TableSchema;
	IDDetail3?: TableSchema;
}

export interface ParamID {
	IDX: TableSchema[];
	id: number | number[];
}

export interface ParamKeyID {
	ID: TableSchema;
	IDX: TableSchema[];
	key: number[];
	page?: ParamPage;
}

export interface ParamID2 {
	ID2: TableSchema;
	id: number | number[];
	IDX: TableSchema[];
	page?: ParamPage;
}

export interface ParamKeyID2 {
	ID: TableSchema;
	key: number[];
	ID2: TableSchema;
	IDX: TableSchema[];
	page?: ParamPage;
}

export interface ParamIDLog {
	IDX: TableSchema;
	field: string;
	id: number;
	log: 'each' | 'day' | 'month' | 'year';
	timeZone?: number;
	page: ParamPage;
}

export abstract class DbServer {
	protected readonly builder: Builder;

	constructor() {
		this.builder = this.createBuilder();
	}

	protected abstract createBuilder(): Builder;

	abstract createProcObjs(db:string): Promise<void>;
	abstract reset():void;
	abstract sql(sql:string, params:any[]): Promise<any>;
	abstract sqlProc(db:string, procName:string, procSql:string): Promise<any>;
    abstract buildProc(db:string, procName:string, procSql:string, isFunc:boolean): Promise<void>;
	abstract buildRealProcFrom$ProcTable(db:string, proc:string): Promise<void>;
	abstract sqlDropProc(db:string, procName:string, isFunc:boolean): Promise<any>;
	abstract call(db:string, proc:string, params:any[]): Promise<any>;
    abstract callEx(db:string, proc:string, params:any[]): Promise<any>;
    abstract buildTuidAutoId(db:string): Promise<void>;
    abstract tableFromProc(db:string, proc:string, params:any[]): Promise<any[]>;
    abstract tablesFromProc(db:string, proc:string, params:any[]): Promise<any[][]>;
    abstract buildDatabase(db:string): Promise<boolean>;
    abstract existsDatabase(db:string): Promise<boolean>;
    abstract createDatabase(db:string): Promise<void>;
    abstract setDebugJobs():Promise<void>;
    abstract uqDbs():Promise<any[]>;
    abstract createResDb(resDbName:string):Promise<void>;
	abstract create$UqDb():Promise<void>;
	
	async IDActs(param:ParamIDActs): Promise<any[]> {
		let sql = this.builder.IDActs(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}

	async IDDetail(unit:number, user:number, param:ParamIDDetail): Promise<any[]> {
		let {db} = param.ID;
		let sql = this.builder.IDDetail(param);
		let ret = await this.call(db, 'tv_$exec_sql_trans', [unit, user, sql]);
		return ret;
	}

	async ID(param: ParamID): Promise<any[]> {
		let sql = this.builder.ID(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}

	async KeyID(param: ParamKeyID): Promise<any[]> {
		let sql = this.builder.KeyID(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}

	async ID2(param: ParamID2): Promise<any[]> {
		let sql = this.builder.ID2(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}
	
	async KeyID2(param: ParamKeyID2): Promise<any[]> {
		let sql = this.builder.KeyID2(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}
	
	async IDLog(param: ParamIDLog): Promise<any[]> {
		let sql = this.builder.IDLog(param);
		let ret = await this.sql(sql, undefined);
		return ret;
	}
}
