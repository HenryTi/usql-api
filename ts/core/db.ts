import * as config from 'config';
import {DbServer} from './dbServer';
import {MsDbServer} from './ms';
import {MyDbServer} from './my';

const const_connectionUnitx = 'connection_$unitx';
const const_connection = 'connection';
const const_development = 'development';
const const_unitx = '$unitx';

export const isDevelopment = (function ():boolean {
    return (process.env.NODE_ENV === const_development);
})();

export class Db {
    private dbName: string;
    private isExists: boolean;
    private dbServer:DbServer;

    constructor(dbName: string) {
        this.dbName = dbName;
        this.dbServer = this.createDbServer();
        this.isExists = false;
    }
    getDbName():string {return this.dbName}
    protected getDbConfig() {
        return config.get<any>(const_connection);
    }
    private createDbServer() {
        let sqlType = config.get<string>('sqlType');
        let dbConfig:any = this.getDbConfig();
        if (dbConfig === undefined) throw 'dbConfig not defined';
        switch (sqlType) {
            case 'mysql': return new MyDbServer(dbConfig);
            case 'mssql': return new MsDbServer(dbConfig);
        }
    }

    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return this.isExists = await this.dbServer.existsDatabase(this.dbName);
    }

    private devLog(proc:string, params:any[]) {
        if (isDevelopment===true) console.log(this.dbName, '.', proc, ': ', params && params.join(','))
    }
    async log(unit:number, uq:string, subject:string, content:string):Promise<void> {
        return await this.dbServer.call('$uq', 'log', [unit, uq, subject, content]);
    }
    async sql(sql:string, params:any[]): Promise<any> {
        this.devLog('sql', params);
        return await this.dbServer.sql(this.dbName, sql, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        this.devLog(proc, params);
        return await this.dbServer.call(this.dbName, proc, params);
    }
    async callEx(proc:string, params:any[]): Promise<any> {
        this.devLog(proc, params);
        return await this.dbServer.callEx(this.dbName, proc, params);
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        this.devLog(proc, params);
        return await this.dbServer.tableFromProc(this.dbName, proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        this.devLog(proc, params);
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

    async initResDb(resDbName:string):Promise<void> {
        await this.dbServer.initResDb(resDbName);
    }
    async init$UqDb():Promise<void> {
        await this.dbServer.init$UqDb();
    }
}

class UnitxDb extends Db {
    protected getDbConfig() {
        if (config.has(const_connectionUnitx) === true) {
            return config.get<any>(const_connectionUnitx);
        }
        else {
            throw `server '${config.get<string>('servername')}' has no connection_$unitx defined in config.json`;
        }
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

// 数据库名称对照表
const dbCollection:{[name:string]:string} = (function () {
    const dbColl = "db";
    if (!config.has(dbColl)) return {};
    return config.get<any>(dbColl);
})();

export function getDb(name:string):Db {
    let db = getCacheDb(name);
    if (db !== undefined) return db;
    let dbName = getDbName(name);
    return dbs[name] = new Db(dbName);
}

export function getUnitxDb(testing:boolean):Db {
    let name = const_unitx;
    if (testing === true) name += '$test';
    let db = getCacheDb(name);
    if (db !== undefined) return db;
    let dbName = getDbName(name);
    return dbs[name] = new UnitxDb(dbName);
}

function getDbName(name:string): string {
    return dbCollection[name] || name;
}

function getCacheDb(name:string):Db {
    return dbs[name];
}
