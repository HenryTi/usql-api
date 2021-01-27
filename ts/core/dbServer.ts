export interface ParamPage {
	start:number;
	size:number;
}

export interface TableSchema {
	db: string;
	name: string;
	type: string;
	fields: {name:string}[];
	values: any[];
}

export interface ParamIDActs {
	[ID:string]: TableSchema;
}

export interface ParamID {
	IDX: TableSchema[];
	id: number | number[];
}

export interface ParamKeyID {
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
	abstract createProcObjs(db:string): Promise<void>;
	abstract reset():void;
	abstract sql(db:string, sql:string, params:any[]): Promise<any>;
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
	
	abstract IDActs(paramIDActs:ParamIDActs): Promise<any[]>;
	abstract ID(paramID: ParamID): Promise<any[]>;
	abstract KeyID(paramID: ParamKeyID): Promise<any[]>;
	abstract ID2(paramID2: ParamID2): Promise<any[]>;
	abstract KeyID2(paramKeyID2: ParamKeyID2): Promise<any[]>;
	abstract IDLog(paramIDLog: ParamIDLog): Promise<any[]>;
}
