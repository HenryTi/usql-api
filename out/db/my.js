"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
const _ = require("lodash");
const dbServer_1 = require("./dbServer");
const db_1 = require("./db");
const retries = 5;
const minMillis = 1;
const maxMillis = 100;
const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;
class MyDbServer extends dbServer_1.DbServer {
    constructor(dbConfig) {
        super();
        let conf = _.clone(dbConfig);
        conf.typeCast = castField;
        this.pool = mysql_1.createPool(conf);
    }
    exec(sql, values) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                let retryCount = 0;
                let handleResponse = (err, result) => {
                    if (err === null) {
                        resolve(result);
                        return;
                    }
                    switch (+err.errno) {
                        case +ER_LOCK_WAIT_TIMEOUT:
                        case +ER_LOCK_TIMEOUT:
                        case +ER_LOCK_DEADLOCK:
                            if (db_1.isDevelopment)
                                console.error(`ERROR - ${err.errno} ${err.message}`);
                            ++retryCount;
                            if (retryCount > retries) {
                                if (db_1.isDevelopment)
                                    console.error(`Out of retries so just returning the error.`);
                                reject(err);
                                return;
                            }
                            let sleepMillis = Math.floor((Math.random() * maxMillis) + minMillis);
                            if (db_1.isDevelopment) {
                                console.error('Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                            }
                            return setTimeout(() => {
                                this.pool.query(sql, values, handleResponse);
                            }, sleepMillis);
                        default:
                            if (db_1.isDevelopment)
                                console.error(`Standard error - ${err.toString()}`);
                            reject(err);
                            return;
                    }
                };
                /*
                let orgHandleResponse = function(err:MysqlError, result:any) {
                    if (err !== null) reject(err);
                    else resolve(result);
                } */
                this.pool.query(sql, values, handleResponse);
            });
        });
    }
    sql(db, sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.exec('use `' + db + '`;' + sql, params);
            if (Array.isArray(result) === false)
                return [];
            let arr = result;
            arr.shift();
            if (arr.length === 1)
                return arr[0];
            return arr;
        });
    }
    execProc(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'call `' + db + '`.`' + proc + '`(';
            if (params !== undefined) {
                let len = params.length;
                if (len > 0) {
                    sql += '?';
                    for (let i = 1; i < len; i++)
                        sql += ',?';
                }
            }
            sql += ')';
            return yield this.exec(sql, params);
        });
    }
    tableFromProc(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.execProc(db, proc, params);
            if (Array.isArray(res) === false)
                return [];
            switch (res.length) {
                case 0: return [];
                default: return res[0];
            }
        });
    }
    tablesFromProc(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.execProc(db, proc, params);
        });
    }
    call(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.execProc(db, proc, params);
            if (Array.isArray(result) === false)
                return [];
            result.pop();
            if (result.length === 1)
                return result[0];
            return result;
        });
    }
    callEx(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //return await this.execProc(db, proc, params);
            let result = yield this.execProc(db, proc, params);
            if (Array.isArray(result) === false)
                return [];
            result.pop();
            return result;
        });
    }
    createDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'CREATE DATABASE IF NOT EXISTS `' + db + '` default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
            yield this.exec(sql, undefined);
        });
    }
    existsDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'SELECT SCHEMA_NAME as sname FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'' + db + '\'';
            let rows = yield this.exec(sql, undefined);
            return rows.length > 0;
        });
    }
    uqDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `select a.schema_name as db from information_schema.schemata a join information_schema.tables b on a.schema_name=b.table_schema where b.table_name='tv_$entity';`;
            let rows = yield this.exec(sql, undefined);
            return rows;
        });
    }
    initResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createDatabase(resDbName);
            let sql = `
            CREATE TABLE if not exists ${resDbName}.item(
                id int not null auto_increment primary key,
                fileName varchar(120),
                mimetype varchar(50),
                uploadDate datetime default now(),
                useDate datetime
            );
        `;
            yield this.exec(sql, undefined);
            let proc = `
            use ${resDbName};
            DROP PROCEDURE IF EXISTS createItem;
            CREATE PROCEDURE createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
            yield this.exec(proc, undefined);
            proc = `
            use ${resDbName};
            DROP PROCEDURE IF EXISTS useItem;
            CREATE PROCEDURE useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
            yield this.exec(proc, undefined);
        });
    }
}
exports.MyDbServer = MyDbServer;
function castField(field, next) {
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
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
function castDate(field) {
    // 这个地方也许有某种方法加速吧
    let d = new Date(new Date(field.string()).getTime() - timezoneOffset);
    return d;
}
//# sourceMappingURL=my.js.map