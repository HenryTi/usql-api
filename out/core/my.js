"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
const pools = [];
function getPool(dbConfig) {
    for (let p of pools) {
        let { config, pool } = p;
        if (_.isEqual(dbConfig, config) === true)
            return pool;
    }
    let conf = _.clone(dbConfig);
    conf.timezone = 'UTC';
    conf.typeCast = castField;
    let newPool = mysql_1.createPool(conf);
    pools.push({ config: dbConfig, pool: newPool });
    return newPool;
}
class MyDbServer extends dbServer_1.DbServer {
    constructor(dbConfig) {
        super();
        this.pool = getPool(dbConfig);
    }
    exec(sql, values, log) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                let retryCount = 0;
                let handleResponse = (err, result) => {
                    if (err === null) {
                        if (log !== undefined) {
                            log.tries = retryCount;
                            log.close();
                        }
                        resolve(result);
                        return;
                    }
                    switch (+err.errno) {
                        case +ER_LOCK_WAIT_TIMEOUT:
                        case +ER_LOCK_TIMEOUT:
                        case +ER_LOCK_DEADLOCK:
                            if (db_1.isDevelopment === true)
                                console.error(`ERROR - ${err.errno} ${err.message}`);
                            ++retryCount;
                            if (retryCount > retries) {
                                if (db_1.isDevelopment === true)
                                    console.error(`Out of retries so just returning the error.`);
                                if (log !== undefined) {
                                    log.tries = retryCount;
                                    log.error = err.sqlMessage;
                                    log.close();
                                }
                                reject(err);
                                return;
                            }
                            let sleepMillis = Math.floor((Math.random() * maxMillis) + minMillis);
                            if (db_1.isDevelopment === true) {
                                console.error('Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                            }
                            return setTimeout(() => {
                                this.pool.query(sql, values, handleResponse);
                            }, sleepMillis);
                        default:
                            if (db_1.isDevelopment === true) {
                                console.error(err);
                                console.error(sql);
                            }
                            if (log !== undefined) {
                                log.tries = retryCount;
                                log.error = err.sqlMessage;
                                log.close();
                            }
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
            let spanLog;
            if (db !== '$uq') {
                let log = db + '.' + proc;
                if (params !== undefined) {
                    log += ': ' + params.join(', ');
                }
                spanLog = db_1.dbLogger.open(log);
            }
            return yield this.exec(sql, params, spanLog);
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
    // return exists
    buildDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
            let ret = yield this.exec(exists, []);
            if (ret.length > 0)
                return true;
            let sql = `CREATE DATABASE IF NOT EXISTS \`${db}\` default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
            yield this.exec(sql, undefined);
            yield this.build$Uq(db);
            return false;
        });
    }
    init$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = 'SELECT SCHEMA_NAME as sname FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'$uq\'';
            let rows = yield this.exec(exists, undefined);
            if (rows.length == 0) {
                let sql = 'CREATE DATABASE IF NOT EXISTS $uq default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
                yield this.exec(sql, undefined);
            }
            let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), create_time timestamp not null default current_timestamp, primary key(`name`), unique key unique_id (id))';
            yield this.exec(createUqTable, undefined);
            let createLog = 'CREATE TABLE IF NOT EXISTS $uq.log (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
            yield this.exec(createLog, undefined);
            let createSetting = 'CREATE TABLE IF NOT EXISTS $uq.setting (`name` varchar(100) not null, `value` varchar(100), update_time timestamp default current_timestamp on update current_timestamp, primary key(`name`))';
            yield this.exec(createSetting, undefined);
            let createPerformance = 'CREATE TABLE IF NOT EXISTS $uq.performance (`time` timestamp(6) not null, ms int, log text, primary key(`time`))';
            yield this.exec(createPerformance, undefined);
            let writeLog = `
create procedure $uq.log(_unit int, _uq varchar(50), _subject varchar(100), _content text) begin
declare _time timestamp(6);
    set _time=current_timestamp(6);
    _exit: loop
        if not exists(select \`unit\` from \`log\` where \`time\`=_time) then
            insert into \`log\` (\`time\`, unit, uq, subject, content) values (_time, _unit, (select id from uq where \`name\`=_uq), _subject, _content);
            leave _exit;
		else
			set _time = ADDDATE(_time,interval 1 microsecond );
		end if;
	end loop;
end;
        `;
            let performanceLog = `
create procedure $uq.performance(_content text) begin
declare _time timestamp(6);
declare _len, _p, _t0, _t1, _n, _ln int;
declare _tSep, _nSep char(1);

set _tSep=char(2);
set _nSep=char(3);
set _time=current_timestamp(6);
set _len=length(_content);
set _p = 1;
_data_loop: loop
      if _p>=_len then leave _data_loop; end if;
    set _t0 = LOCATE(_tSep, _content, _p);
    set _t1 = LOCATE(_tSep, _content, _t0+1);
    SET _n = LOCATE(_nSep, _content, _t1+1);
    if _n=0 then SET _ln=_len+1; ELSE SET _ln=_n; END if;
    set _time=from_unixtime(SUBSTRING(_content, _p, _t0-_p)/1000);
    _exit: loop
        if not exists(select \`time\` from performance where \`time\`=_time) then
            insert into performance (\`time\`, log, ms) values (
                _time, 
                SUBSTRING(_content, _t0+1, _t1-_t0-1), 
                SUBSTRING(_content, _t1+1, _ln-_t1-1));
            if _n=0 then leave _data_loop; end if;
            leave _exit;
        else
            set _time = ADDDATE(_time,interval 1 microsecond );
        end if;
    end loop;
   set _p=_n+1;
   set _time = ADDDATE(_time,interval 1 microsecond );
end loop;
end;
        `;
            let procExists = `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`;
            let retProcExists = yield this.exec(procExists, undefined);
            if (retProcExists.length === 0) {
                yield this.exec(writeLog, undefined);
            }
            let performanceExists = `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`;
            let retPerformanceExists = yield this.exec(performanceExists, undefined);
            if (retPerformanceExists.length === 0) {
                yield this.exec(performanceLog, undefined);
            }
        });
    }
    build$Uq(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
            yield this.exec(insertUqDb, undefined);
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
    setDebugJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `insert into $uq.setting (\`name\`, \`value\`) VALUES ('debugging_jobs', 'yes') 
        ON DUPLICATE KEY UPDATE update_time=current_timestamp;`;
            yield this.exec(sql, undefined);
        });
    }
    uqDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = db_1.isDevelopment === true ?
                'select name as db from $uq.uq;' :
                `select name as db 
	            from $uq.uq 
        	    where not exists(SELECT \`name\` FROM $uq.setting WHERE \`name\`='debugging_jobs' AND \`value\`='yes' AND UNIX_TIMESTAMP()-unix_timestamp(update_time)<600);`;
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
const castField = (field, next) => {
    switch (field.type) {
        default: return next();
        case 'DATE': return castDate(field);
        case 'DATETIME': return castDateTime(field);
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
};
// 确保服务器里面保存的时间是UTC时间
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
function castDate(field) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();
    return text;
}
function castDateTime(field) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();
    ;
    return text;
    /*
    let text = field.string();
    if (text === null) return null;
    if (text === undefined) return undefined;
    let d = new Date(new Date(text).getTime() - timezoneOffset);
    return d;
    */
}
//# sourceMappingURL=my.js.map