import { Builder } from "./builder";

export interface ParamPage {
	start: number;
	size: number;
}

export interface Field {
	name:string;
	type:string;
	track: boolean;
}

export interface ExField {
	field: string;
	sum: boolean;
	log: boolean;
	time: boolean;
	track: boolean;
	memo: boolean;
}

export interface EntitySchema {
	typeId:number;
	type:string; 
	keys:Field[]; 
	fields:Field[]; 
	owner: boolean; 
	create: boolean;
	update: boolean;
	exFields:ExField[];
}

export interface TableSchema {
	name: string;
	schema: EntitySchema;
	values: any[];
}

export interface ParamActs {
	[ID:string]: TableSchema;
}

export interface ParamActIX {
	IX: TableSchema;
	ID: TableSchema;
	IXs?: {IX:TableSchema, ix:number}[];
	values: any[];
}

export interface ParamActIXSort {
	IX: TableSchema;
	ix: number;
	xi: number;					// id to be moved
	after: number;				// insert after id. if before first, then 0
}

export interface ParamActDetail {
	master: TableSchema;
	detail: TableSchema;
	detail2?: TableSchema;
	detail3?: TableSchema;
}

export interface ParamIDNO {
	ID: TableSchema;
}

export interface ParamIDDetailGet extends ParamActDetail {
	id: number;
}

export interface ParamID {
	IDX: TableSchema[];
	id: number | number[];
	order?: 'asc' | 'desc',
	page?: ParamPage;
}

export interface ParamKeyID {
	ID: TableSchema;
	IDX: TableSchema[];
	key: {[key:string]:number|string};
	page?: ParamPage;
}

export interface ParamIX {
	IX: TableSchema;
	IX1: TableSchema;
	ix: number | number[];
	IDX?: TableSchema[];
	order?: 'asc' | 'desc';
	page?: ParamPage;
}

export interface ParamKeyIX {
	ID: TableSchema;
	key: {[key:string]:number|string};
	IX: TableSchema;
	IDX?: TableSchema[];
	page?: ParamPage;
}

export interface ParamIDLog {
	IDX: TableSchema;
	field: string;
	id: number;
	log: 'each' | 'day' | 'week' | 'month' | 'year';
	timeZone?: number;
	far?: number;
	near?: number;
	page: ParamPage;
}

export interface ParamSum {
	IDX: TableSchema;
	field: string[];
	far: number;		// 开始时间tick >= far
	near: number;		// 结束时间tick < near
}

export interface ParamIDSum extends ParamSum {
	id: number|number[];
}

export interface ParamKeyIDSum extends ParamSum {
	ID: TableSchema;
	key: {[key:string]:number|string};
	page?: ParamPage;
}

export interface ParamIXSum extends ParamSum {
	IX: TableSchema;
	ix: number|number[];
	page?: ParamPage;
}

export interface ParamKeyIXSum extends ParamSum {
	ID: TableSchema;
	key: {[key:string]:number|string};
	IX: TableSchema;
	page?: ParamPage;
}

export interface ParamIDinIX {
	ID: TableSchema;
	ix: number;
	IX: TableSchema;
	page: ParamPage;
}

export interface ParamIDxID {
	ID: TableSchema;
	IX: TableSchema;
	ID2: TableSchema;
	page?: ParamPage;
}

export interface ParamIDTree {
	ID: TableSchema;
	parent: number;
	key: string|number;
	level: number;				// 无值，默认1一级
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
	
	private async execSql(unit:number, user:number, sql:string):Promise<any[]> {
		let ret = await this.call(this.dbName, 'tv_$exec_sql', [unit, user, sql]);
		return ret;
	}

	private async execSqlTrans(unit:number, user:number, sql:string):Promise<any[]> {
		let ret = await this.call(this.dbName, 'tv_$exec_sql_trans', [unit, user, sql]);
		return ret;
	}

	async Acts(unit:number, user:number, param:ParamActs): Promise<any[]> {
		let sql = this.builder.Acts(param).build();
		let ret = await this.execSqlTrans(unit, user, sql);
		return ret;
	}

	async ActIX(unit:number, user:number, param:ParamActIX): Promise<any[]> {
		let sql = this.builder.ActIX(param).build();
		let ret = await this.execSqlTrans(unit, user, sql);
		return ret;
	}

	async ActIXSort(unit:number, user:number, param:ParamActIXSort): Promise<any[]> {
		let sql = this.builder.ActIXSort(param).build();
		return await this.execSqlTrans(unit, user, sql);
	}

	async ActDetail(unit:number, user:number, param:ParamActDetail): Promise<any[]> {
		let sql = this.builder.ActDetail(param).build();
		return await this.execSqlTrans(unit, user, sql);
	}

	async IDNO(unit:number, user:number, param:ParamIDNO): Promise<string> {
		let sql = this.builder.IDNO(param).build();
		let ret = await this.execSql(unit, user, sql);
		return ret[0]['no'];
	}

	async IDDetailGet(unit:number, user:number, param:ParamActDetail): Promise<any[]> {
		let sql = this.builder.IDDetailGet(param).build();
		return await this.execSql(unit, user, sql);
	}

	async ID(unit:number, user:number, param: ParamID): Promise<any[]> {
		let sql = this.builder.ID(param).build();
		return await this.execSql(unit, user, sql);
	}

	async KeyID(unit:number, user:number, param: ParamKeyID): Promise<any[]> {
		let sql = this.builder.KeyID(param).build();
		return await this.execSql(unit, user, sql);
	}

	async IX(unit:number, user:number, param: ParamIX): Promise<any[]> {
		let sql = this.builder.IX(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IXr(unit:number, user:number, param: ParamIX): Promise<any[]> {
		let sql = this.builder.IXr(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async KeyIX(unit:number, user:number, param: ParamKeyIX): Promise<any[]> {
		let sql = this.builder.KeyIX(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IDLog(unit:number, user:number, param: ParamIDLog): Promise<any[]> {
		let sql = this.builder.IDLog(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IDSum(unit:number, user:number, param: ParamIDSum): Promise<any[]> {
		let sql = this.builder.IDSum(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async KeyIDSum(unit:number, user:number, param: ParamKeyIDSum): Promise<any[]> {
		let sql = this.builder.KeyIDSum(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IXSum(unit:number, user:number, param: ParamIXSum): Promise<any[]> {
		let sql = this.builder.IXSum(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async KeyIXSum(unit:number, user:number, param: ParamKeyIXSum): Promise<any[]> {
		let sql = this.builder.KeyIXSum(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IDinIX(unit:number, user:number, param: ParamIDinIX): Promise<any[]> {
		let sql = this.builder.IDinIX(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IDxID(unit:number, user:number, param: ParamIDxID): Promise<any[]> {
		let sql = this.builder.IDxID(param).build();
		return await this.execSql(unit, user, sql);
	}
	
	async IDTree(unit:number, user:number, param: ParamIDTree): Promise<any[]> {
		let sql = this.builder.IDTree(param).build();
		return await this.execSql(unit, user, sql);
	}
}
