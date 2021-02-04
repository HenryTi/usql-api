import { Builder } from "./builder";

export interface ParamPage {
	start:number;
	size:number;
}

interface Field {
	name:string;
	type:string;
	track: boolean;
}

interface ExField {
	field: string;
	sum: string;
	log: boolean;
	track: boolean;
	memo: boolean;
}

export interface TableSchema {
	name: string;
	schema: {
		typeId:number;
		type:string; 
		keys:Field[]; 
		fields:Field[]; 
		owner:boolean; 
		exFields:ExField[];
	};
	values: any[];
}

export interface ParamIDActs {
	[ID:string]: TableSchema;
}

export interface ParamIDDetail {
	master: TableSchema;
	detail: TableSchema;
	detail2?: TableSchema;
	detail3?: TableSchema;
}

export interface ParamIDDetailGet extends ParamIDDetail {
	id: number;
}

export interface ParamID {
	IDX: TableSchema[];
	id: number | number[];
}

export interface ParamKeyID {
	ID: TableSchema;
	IDX: TableSchema[];
	key: {[key:string]:number|string};
	page?: ParamPage;
}

export interface ParamID2 {
	ID2: TableSchema;
	id: number | number[];
	IDX?: TableSchema[];
	page?: ParamPage;
}

export interface ParamKeyID2 {
	ID: TableSchema;
	key: {[key:string]:number|string};
	ID2: TableSchema;
	IDX?: TableSchema[];
	page?: ParamPage;
}

export interface ParamIDLog {
	IDX: TableSchema;
	field: string;
	id: number;
	log: 'each' | 'day' | 'week' | 'month' | 'year';
	timeZone?: number;
	page: ParamPage;
}

export abstract class DbServer {
	protected dbName: string;
	hasUnit: boolean;
	protected readonly builder: Builder;

	constructor(dbName:string) {
		this.dbName = dbName;
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
	
	async IDActs(unit:number, user:number, param:ParamIDActs): Promise<any[]> {
		let sql = this.builder.IDActs(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
		return ret;
	}

	async IDDetail(unit:number, user:number, param:ParamIDDetail): Promise<any[]> {
		let sql = this.builder.IDDetail(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
		return ret;
	}

	async IDDetailGet(unit:number, user:number, param:ParamIDDetail): Promise<any[]> {
		let sql = this.builder.IDDetailGet(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}

	async ID(unit:number, user:number, param: ParamID): Promise<any[]> {
		let sql = this.builder.ID(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}

	async KeyID(unit:number, user:number, param: ParamKeyID): Promise<any[]> {
		let sql = this.builder.KeyID(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}

	async ID2(unit:number, user:number, param: ParamID2): Promise<any[]> {
		let sql = this.builder.ID2(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}
	
	async KeyID2(unit:number, user:number, param: ParamKeyID2): Promise<any[]> {
		let sql = this.builder.KeyID2(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}
	
	async IDLog(unit:number, user:number, param: ParamIDLog): Promise<any[]> {
		let sql = this.builder.IDLog(param);
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}
}
