import * as config from 'config';
import {DbServer} from './dbServer';
import {MsDbServer} from './ms';
import {MyDbServer} from './my';

function createDbServer() {
    let sqlType = config.get<string>('sqlType');
    let dbConfig = config.get<any>('connection');
    switch (sqlType) {
        case 'mysql': return new MyDbServer(dbConfig);
        case 'mssql': return new MsDbServer(dbConfig);
    }
}

let dbServer:DbServer = createDbServer();

export class Db {
    private dbName: string;
    private isExists: boolean;
    constructor(dbName: string) {
        this.dbName = dbName;
        this.isExists = false;
    }
    setExists() {this.isExists = true;}
    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return await dbServer.existsDatabase(this.dbName);
    }
    async sql(sql:string, params:any[]): Promise<any> {
        return await dbServer.sql(this.dbName, sql, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        return await dbServer.call(this.dbName, proc, params);
    }
    async callEx(proc:string, params:any[]): Promise<any> {
        return await dbServer.callEx(this.dbName, proc, params);
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        return await dbServer.tableFromProc(this.dbName, proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        return await dbServer.tablesFromProc(this.dbName, proc, params);
    }
    async createDatabase(): Promise<void> {
        return await dbServer.createDatabase(this.dbName)
    }
}

const dbs:{[name:string]:Db} = {
}

/*
const projects = config.get<any>("projects");

export function dbNameFromProject(projectName:string) {
    let proj = projects[projectName];
    return proj && proj.db;
}
*/

export function getDb(name:string):Db {
    let db = dbs[name];
    if (db !== undefined) return db;
    //let dbName = dbNameFromProject(name);
    //if (dbName === undefined) return;
    // 开发用户定义usqldb之后，直接用usqldb的dbname，所以，dbname不能有符号什么的，因为会通过url上传
    //if (dbName === undefined) 
    //let dbName = name;
    if (dbServer === undefined) dbServer = createDbServer();
    //dbs[name] = db = new Db(dbName);
    dbs[name] = db = new Db(name);
    return db;
}
