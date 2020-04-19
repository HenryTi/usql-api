export abstract class DbServer {
	abstract initProcObjs(db:string): Promise<void>;
	abstract sql(db:string, sql:string, params:any[]): Promise<any>;
	abstract sqlProc(db:string, procName:string, procSql:string): Promise<any>;
	abstract sqlDropProc(db:string, procName:string): Promise<any>;
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
    abstract initResDb(resDbName:string):Promise<void>;
    abstract init$UqDb():Promise<void>;
}
