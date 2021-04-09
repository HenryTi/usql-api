import { MsBuilder } from './builder';
import {DbServer} from './dbServer';

export class MsDbServer extends DbServer {
	constructor(dbName:string, dbConfig: any) {
		super(dbName);
	}

	protected createBuilder() { return new MsBuilder(this.dbName, this.hasUnit); }

	createProcObjs(db:string): Promise<void> {return}
	reset():void {};
    sql(sql:string, params:any[]): Promise<any> {return}
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
}
