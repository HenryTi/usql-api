import {createConnection, createPool, QueryError, RowDataPacket, OkPacket, Pool} from 'mysql';
import {DbServer} from './dbServer';

export class MyDbServer extends DbServer {
    private pool: Pool;
    constructor(dbConfig:any) {
        super();
        dbConfig.typeCast = castField;
        this.pool = createPool(dbConfig);
    }
    private async exec(sql:string, values:any[]): Promise<any> {
        return await new Promise<any>((resolve, reject) => {
            this.pool.query(sql, values, (err, result) => {
                if (err !== null) {
                    reject(err);
                    return;
                }
                resolve(result);
            })
        });
    }
    async sql(db:string, sql:string, params:any[]): Promise<any> {
        let result = await this.exec('use `'+db+'`;'+sql, params);
        if (Array.isArray(result) === false) return [];
        let arr = result as any[];
        arr.shift();
        if (arr.length === 1) return arr[0];
        return arr;
    }
    private async execProc(db:string, proc:string, params:any[]): Promise<any> {
        let sql = 'call `'+db+'`.`'+proc+'`(';
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i=1;i<len;i++) sql += ',?';
            }
        }
        sql += ')';
        return await this.exec(sql, params);
    }
    async tableFromProc(db:string, proc:string, params:any[]): Promise<any[]> {
        let res = await this.execProc(db, proc, params);
        if (Array.isArray(res) === false) return [];
        switch (res.length) {
            case 0: return [];
            default: return res[0];
        }
    }
    async tablesFromProc(db:string, proc:string, params:any[]): Promise<any[][]> {
        return await this.execProc(db, proc, params);
    }
    async call(db:string, proc:string, params:any[]): Promise<any> {
        let result:any[][] = await this.execProc(db, proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        if (result.length === 1) return result[0];
        return result;
    }
    async callEx(db:string, proc:string, params:any[]): Promise<any> {
        //return await this.execProc(db, proc, params);
        let result:any[][] = await this.execProc(db, proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        return result;
    }
    async createDatabase(db:string): Promise<void> {
        let sql = 'CREATE DATABASE IF NOT EXISTS `'+db+'` default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
        await this.exec(sql, undefined);
    }
    async existsDatabase(db:string): Promise<boolean> {
        let sql = 'SELECT SCHEMA_NAME as sname FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'' + db + '\'';
        let rows:RowDataPacket[] = await this.exec(sql, undefined);
        return rows.length > 0;
    }
    async uqDbs():Promise<any[]> {
        let sql = `select a.schema_name as db from information_schema.schemata a join information_schema.tables b on a.schema_name=b.table_schema where b.table_name='tv_$entity';`;
        let rows:RowDataPacket[] = await this.exec(sql, undefined);
        return rows;
    }
}

function castField( field, next ) {
    switch (field.type) {
        default: return next();
        case 'DATETIME': return castDate(field);
    }
    /*
    if (( field.type === "BIT" ) && ( field.length === 1 ) ) {
        var bytes = field.buffer();
        // A Buffer in Node represents a collection of 8-bit unsigned integers.
        // Therefore, our single "bit field" comes back as the bits '0000 0001',
        // which is equivalent to the number 1.
        return( bytes[ 0 ] === 1 );
    }
    return next();
    */
}

// 确保服务器里面保存的时间是UTC时间
const timezoneOffset = new Date().getTimezoneOffset()*60000;
function castDate(field) {
    // 这个地方也许有某种方法加速吧
    let d = new Date(new Date(field.string()).getTime() - timezoneOffset);
    return d;
}