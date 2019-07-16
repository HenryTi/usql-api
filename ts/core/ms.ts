import {DbServer} from './dbServer';

export class MsDbServer extends DbServer {
    constructor(dbConfig:any) {
        super();
    }
    sql(db:string, sql:string, params:any[]): Promise<any> {return}
    async call(db:string, proc:string, params:any[]): Promise<any> {return}
    callEx(db:string, proc:string, params:any[]): Promise<any> {return}
    tableFromProc(db:string, proc:string, params:any[]): Promise<any[]> {return}
    tablesFromProc(db:string, proc:string, params:any[]): Promise<any[][]> {return}
    createDatabase(db:string): Promise<void> {return}
    existsDatabase(db:string): Promise<boolean> {return}
    uqDbs():Promise<any[]> {return}
    initResDb(resDbName:string):Promise<void> {return}
}
