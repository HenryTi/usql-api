import * as config from 'config';
import {DbServer} from './dbServer';
import {MsDbServer} from './ms';
import {MyDbServer} from './my';

const const_connectionUnitx = 'connection_$unitx';
const const_connection = 'connection';
const const_development = 'development';
const const_unitx = '$unitx';

export const isDevelopment = (process.env.NODE_ENV === const_development);

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
    private createDbServer() {
        let sqlType = config.get<string>('sqlType');
        let dbConfig;
        if (this.dbName === const_unitx && isDevelopment === true) {
            if (config.has(const_connectionUnitx) === true) {
                dbConfig = config.get<any>(const_connectionUnitx);
            }
        }
        if (dbConfig === undefined) {
            dbConfig = config.get<any>(const_connection);
        }
        switch (sqlType) {
            case 'mysql': return new MyDbServer(dbConfig);
            case 'mssql': return new MsDbServer(dbConfig);
        }
    }

    async exists(): Promise<boolean> {
        if (this.isExists === true) return true;
        return this.isExists = await this.dbServer.existsDatabase(this.dbName);
    }
    async sql(sql:string, params:any[]): Promise<any> {
        console.log(this.dbName, ' sql: ', params.join(','))
        return await this.dbServer.sql(this.dbName, sql, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        console.log(this.dbName, '.', proc, ': ', params.join(','))
        return await this.dbServer.call(this.dbName, proc, params);
    }
    async callEx(proc:string, params:any[]): Promise<any> {
        console.log(this.dbName, '.', proc, ': ', params.join(','))
        return await this.dbServer.callEx(this.dbName, proc, params);
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        console.log(this.dbName, '.', proc, ': ', params.join(','))
        return await this.dbServer.tableFromProc(this.dbName, proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        console.log(this.dbName, '.', proc, ': ', params.join(','))
        return await this.dbServer.tablesFromProc(this.dbName, proc, params);
    }
    async createDatabase(): Promise<void> {
        return await this.dbServer.createDatabase(this.dbName);
    }
    async uqDbs():Promise<any[]> {
        return await this.dbServer.uqDbs();
    }

    async initResDb(resDbName:string):Promise<void> {
        await this.dbServer.initResDb(resDbName);
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
    let db = dbs[name];
    if (db !== undefined) return db;
    let dbName = dbCollection[name];
    if (dbName === undefined) dbName = name;
    //let dbName = dbNameFromProject(name);
    //if (dbName === undefined) return;
    // 开发用户定义uqdb之后，直接用uqdb的dbname，所以，dbname不能有符号什么的，因为会通过url上传
    //if (dbName === undefined) 
    //let dbName = name;
    //if (dbServer === undefined) dbServer = createDbServer();
    dbs[name] = db = new Db(dbName);
    return db;
}
