import {DbServer, ParamID, ParamID2, ParamIDActs, ParamIDLog, ParamKeyID, ParamKeyID2} from './dbServer';

export class MsDbServer extends DbServer {
	constructor(dbName:string, dbConfig: any) {
		super();
	}
	createProcObjs(db:string): Promise<void> {return}
	reset():void {};
    sql(db:string, sql:string, params:any[]): Promise<any> {return}
	sqlProc(db:string, procName:string, procSql:string): Promise<any> {return}
    buildProc(db:string, procName:string, procSql:string, isFunc:boolean): Promise<void> {return}
	buildRealProcFrom$ProcTable(db:string, proc:string): Promise<void> {return}
	sqlDropProc(db:string, procName:string, isFunc:boolean): Promise<any> {return}
    call(db:string, proc:string, params:any[]): Promise<any> {return}
    callEx(db:string, proc:string, params:any[]): Promise<any> {return}
    buildTuidAutoId(db:string): Promise<void> {return}
    tableFromProc(db:string, proc:string, params:any[]): Promise<any[]> {return}
    tablesFromProc(db:string, proc:string, params:any[]): Promise<any[][]> {return}
    buildDatabase(db:string): Promise<boolean> {return}
    createDatabase(db:string): Promise<void> {return}
    existsDatabase(db:string): Promise<boolean> {return}
    setDebugJobs():Promise<void> {return}
    uqDbs():Promise<any[]> {return}
    createResDb(resDbName:string):Promise<void> {return}
    create$UqDb():Promise<void> {return}
	
	IDActs(paramIDActs:ParamIDActs): Promise<any[]> {return}
	ID(paramID: ParamID): Promise<any[]> {return}
	KeyID(paramID: ParamKeyID): Promise<any[]> {return}
	ID2(paramID2: ParamID2): Promise<any[]> {return}
	KeyID2(paramKeyID2: ParamKeyID2): Promise<any[]> {return}
	IDLog(paramIDLog: ParamIDLog): Promise<any[]> {return}
}
