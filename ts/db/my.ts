import {createPool, Pool, MysqlError} from 'mysql';
import * as _ from 'lodash';
import {DbServer} from './dbServer';
import { isDevelopment } from './db';

const retries = 5;
const minMillis = 1;
const maxMillis = 100;

const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;

export class MyDbServer extends DbServer {
    private pool: Pool;
    constructor(dbConfig:any) {
        super();
        let conf = _.clone(dbConfig);
        conf.typeCast = castField;
        this.pool = createPool(conf);
    }
    private async exec(sql:string, values:any[]): Promise<any> {
        return await new Promise<any>((resolve, reject) => {
            let retryCount = 0;
            let handleResponse = (err:MysqlError, result:any) => {
                if (err === null) {
                    resolve(result);
                    return;
                }
                switch (+err.errno) {
                case +ER_LOCK_WAIT_TIMEOUT:
                case +ER_LOCK_TIMEOUT:
                case +ER_LOCK_DEADLOCK:
                    if (isDevelopment) console.error(`ERROR - ${ err.errno } ${ err.message }`);
                    ++retryCount;
                    if (retryCount > retries) {    
                        if (isDevelopment) console.error(`Out of retries so just returning the error.`);
                        reject(err);
                        return;
                    }    
                    let sleepMillis = Math.floor((Math.random()*maxMillis)+minMillis)
                    if (isDevelopment) {
                        console.error('Retrying request with',retries-retryCount,'retries left. Timeout',sleepMillis);
                    }    
                    return setTimeout(() => {
                        this.pool.query(sql, values, handleResponse);
                    }, sleepMillis);
                default:
                    if (isDevelopment) console.error(`Standard error - ${ err.toString() }`);
                    reject(err);
                    return;
                }
            }
            /*
            let orgHandleResponse = function(err:MysqlError, result:any) {
                if (err !== null) reject(err);
                else resolve(result);
            } */
            this.pool.query(sql, values, handleResponse);
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
        let rows:any[] = await this.exec(sql, undefined);
        return rows.length > 0;
    }
    async uqDbs():Promise<any[]> {
        let sql = `select a.schema_name as db from information_schema.schemata a join information_schema.tables b on a.schema_name=b.table_schema where b.table_name='tv_$entity';`;
        let rows:any[] = await this.exec(sql, undefined);
        return rows;
    }
    async initResDb(resDbName:string):Promise<void> {
        await this.createDatabase(resDbName);
        let sql = `
            CREATE TABLE if not exists ${resDbName}.item(
                id int not null auto_increment primary key,
                fileName varchar(120),
                mimetype varchar(50),
                uploadDate datetime default now(),
                useDate datetime
            );
        `;
        await this.exec(sql, undefined);
        let proc = `
            use ${resDbName};
            DROP PROCEDURE IF EXISTS createItem;
            CREATE PROCEDURE createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
        await this.exec(proc, undefined);

        proc = `
            use ${resDbName};
            DROP PROCEDURE IF EXISTS useItem;
            CREATE PROCEDURE useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
        await this.exec(proc, undefined);
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