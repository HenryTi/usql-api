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
exports.MyDbServer = void 0;
const mysql_1 = require("mysql");
const _ = require("lodash");
const dbServer_1 = require("./dbServer");
const db_1 = require("./db");
const consts_1 = require("./consts");
const retries = 5;
const minMillis = 1;
const maxMillis = 100;
const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;
const pools = [];
const sqls = {
    procExists: undefined,
    performanceExists: undefined,
    uidExists: undefined,
    dateToUidExists: undefined,
    uidToDateExists: undefined,
};
const sqls_8 = {
    procExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log';`,
    performanceExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='performance';`,
    uidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uid';`,
    dateToUidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
};
const sqls_5 = {
    procExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`,
    performanceExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`,
    uidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='uid';`,
    dateToUidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
};
/*
const collationConnection = `
    SET character_set_client = 'utf8';
    SET collation_connection = 'utf8_unicode_ci';
`;
*/
const sysProcColl = {
    tv_$entitys: true,
    tv_$entity: true,
    tv_$entity_version: true,
    tv_$entity_validate: true,
    tv_$entity_no: true,
    tv_$init_setting: true,
    tv_$set_setting: true,
    tv_$get_setting: true,
    tv_$const_strs: true,
    tv_$const_str: true,
    tv_$tag_values: true,
    tv_$tag_type: true,
    tv_$tag_save_sys: true,
    tv_$tag_save: true,
};
class MyDbServer extends dbServer_1.DbServer {
    constructor(dbName, dbConfig) {
        super();
        //this.dbName = dbName;
        this.dbConfig = dbConfig;
        this.resetProcColl();
    }
    resetProcColl() {
        this.procColl = _.merge({}, sysProcColl);
    }
    reset() { this.resetProcColl(); }
    ;
    getPool() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let p of pools) {
                let { config, pool } = p;
                if (_.isEqual(this.dbConfig, config) === true)
                    return pool;
            }
            let conf = _.clone(this.dbConfig);
            conf.timezone = 'UTC';
            conf.typeCast = castField;
            conf.connectionLimit = 10;
            conf.waitForConnections = true;
            conf.acquireTimeout = 10000;
            conf.multipleStatements = true;
            //conf.charset = 'utf8mb4';
            //let newPool = await this.createPool(conf);
            let newPool = mysql_1.createPool(conf);
            pools.push({ config: this.dbConfig, pool: newPool });
            return newPool;
        });
    }
    sqlExists(db) {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }
    exec(sql, values, log) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool === undefined) {
                this.pool = yield this.getPool();
                // await this.assertPool();
            }
            return yield new Promise((resolve, reject) => {
                let retryCount = 0;
                let isDevelopment = db_1.env.isDevelopment;
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
                            if (isDevelopment === true)
                                console.error(`ERROR - ${err.errno} ${err.message}`);
                            ++retryCount;
                            if (retryCount > retries) {
                                if (isDevelopment === true)
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
                            if (isDevelopment === true) {
                                console.error(sql + ': ---- Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                            }
                            return setTimeout(() => {
                                debugger;
                                this.pool.query(sql, values, handleResponse);
                            }, sleepMillis);
                        default:
                            if (isDevelopment === true) {
                                debugger;
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
                this.pool.query(sql, values, handleResponse);
                /*
                this.pool.getConnection(function(err, connection) {
                    if (err) {
                        console.error(err);
                        debugger;
                        reject(err);
                        return;
                    }
                    connection.query(sql, values, function(error, results) {
                        connection.release();
                        handleResponse(error, results);
                    });
                })
                */
            });
        });
    }
    sql(db, sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.exec(sql, params);
            return result;
        });
    }
    sqlDropProc(db, procName, isFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
            let sql = `DROP ${type} IF EXISTS  \`${db}\`.\`${procName}\``;
            yield this.exec(sql, []);
        });
    }
    buidlCallProcSql(db, proc, params) {
        let c = 'call `' + db + '`.`' + proc + '`(';
        let sql = c;
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i = 1; i < len; i++)
                    sql += ',?';
            }
        }
        sql += ')';
        return sql;
    }
    callProcBase(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.buidlCallProcSql(db, proc, params);
            let ret = yield this.exec(sql, params);
            return ret;
        });
    }
    sqlProc(db, procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.callProcBase(db, 'tv_$proc_save', [db, procName, procSql]);
            let t0 = ret[0];
            let changed = t0[0]['changed'];
            let isOk = changed === 0;
            this.procColl[procName.toLowerCase()] = isOk;
        });
    }
    buildProc(db, procName, procSql, isFunc = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
            let drop = `USE \`${db}\`; DROP ${type} IF EXISTS \`${db}\`.\`${procName}\`;`;
            yield this.sql(db, drop + /*collationConnection + */ procSql, undefined);
            // clear changed flag
            yield this.callProcBase(db, 'tv_$proc_save', [db, procName, undefined]);
        });
    }
    buildRealProcFrom$ProcTable(db, proc) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield this.callProcBase(db, 'tv_$proc_get', [db, proc]);
            let ret = results[0];
            if (ret.length === 0) {
                debugger;
                throw new Error(`proc not defined: ${db}.${proc}`);
            }
            let r0 = ret[0];
            let procSql = r0['proc'];
            let drop = `USE \`${db}\`; DROP PROCEDURE IF EXISTS \`${db}\`.\`${proc}\`;`;
            yield this.sql(db, drop + procSql, undefined);
            yield this.callProcBase(db, 'tv_$proc_save', [db, proc, undefined]);
        });
    }
    execProc(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let needBuildProc;
            let dbFirstChar = db[0];
            if (dbFirstChar === '$') {
                if (db.startsWith(consts_1.consts.$unitx) === true) {
                    needBuildProc = true;
                }
                else {
                    needBuildProc = false;
                }
            }
            else {
                needBuildProc = true;
            }
            if (needBuildProc === true) {
                let procLower = proc.toLowerCase();
                let p = this.procColl[procLower];
                if (p !== true) {
                    let results = yield this.callProcBase(db, 'tv_$proc_get', [db, proc]);
                    let ret = results[0];
                    if (ret.length === 0) {
                        debugger;
                        throw new Error(`proc not defined: ${db}.${proc}`);
                    }
                    let r0 = ret[0];
                    let changed = r0['changed'];
                    if (changed === 1) {
                        // await this.sqlDropProc(db, proc);
                        let sql = r0['proc'];
                        yield this.buildProc(db, proc, sql);
                    }
                    this.procColl[procLower] = true;
                }
            }
            return yield this.execProcBase(db, proc, params);
        });
    }
    execProcBase(db, proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let c = 'call `' + db + '`.`' + proc + '`(';
            let sql = c;
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
                let log = c;
                if (params !== undefined) {
                    let len = params.length;
                    for (let i = 0; i < len; i++) {
                        if (i > 0)
                            log += ',';
                        let v = params[i];
                        if (v === undefined)
                            log += 'null';
                        else if (v === null)
                            log += 'null';
                        else {
                            log += '\'' + v + '\'';
                        }
                    }
                }
                log += ')';
                spanLog = yield db_1.dbLogger.open(log);
            }
            return yield this.exec(sql, params, spanLog);
        });
    }
    buildTuidAutoId(db) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            let sql1 = `UPDATE \`${db}\`.tv_$entity a
                    inner JOIN information_schema.tables b ON
                        a.name=CONVERT(substring(b.table_name, 4) USING utf8) COLLATE utf8_unicode_ci
                        AND b.TABLE_SCHEMA='${db}'
                    SET a.tuidVid=b.AUTO_INCREMENT
                    WHERE b.AUTO_INCREMENT IS NOT null;
            `;
            let sql2 = `UPDATE \`${db}\`.tv_$entity a
                    inner JOIN information_schema.tables b ON
                        a.name=substring(b.table_name, 4)
                        AND b.TABLE_SCHEMA='${db}'
                    SET a.tuidVid=b.AUTO_INCREMENT
                    WHERE b.AUTO_INCREMENT IS NOT null;
            `;
            */
            let sql1 = `UPDATE \`${db}\`.tv_$entity a 
			SET a.tuidVid=(select b.AUTO_INCREMENT 
				from information_schema.tables b
				where b.table_name=concat('tv_', a.name)
				AND b.TABLE_SCHEMA='${db}'
			);
        `;
            //where b.table_name=concat('tv_', CONVERT(a.name USING utf8) COLLATE utf8_general_ci)
            /*
            let sql2 = `UPDATE \`${db}\`.tv_$entity a
                SET a.tuidVid=(select b.AUTO_INCREMENT
                    from information_schema.tables b
                    where b.table_name=concat('tv_', a.name)
                    AND b.TABLE_SCHEMA='${db}'
                );
            `;
            */
            //where b.table_name=concat('tv_', CONVERT(a.name USING utf8) COLLATE utf8_unicode_ci)
            //try {
            yield this.exec(sql1, []);
            //}
            //catch {
            //await this.exec(sql2, []);
            //}
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
            this.resetProcColl();
            let exists = this.sqlExists(db);
            // `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
            let ret = yield this.exec(exists, []);
            if (ret.length > 0)
                return true;
            let sql = `CREATE DATABASE IF NOT EXISTS \`${db}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
            yield this.exec(sql, undefined);
            yield this.insertInto$Uq(db);
            return false;
        });
    }
    createProcObjs(db) {
        return __awaiter(this, void 0, void 0, function* () {
            //let useDb = 'use `' + db + '`;';
            const createProcTable = `
CREATE TABLE IF NOT EXISTS \`${db}\`.\`tv_$proc\` (
	\`name\` VARCHAR(200) NOT NULL,
	\`proc\` TEXT NULL, 
	\`changed\` TINYINT(4) NULL DEFAULT NULL,
	PRIMARY KEY (\`name\`));
`;
            // CHARACTER SET utf8 COLLATE utf8_unicode_ci
            yield this.exec(createProcTable, undefined);
            const getProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.tv_$proc_get;
CREATE PROCEDURE \`${db}\`.tv_$proc_get(
	IN _schema VARCHAR(200),
	IN _name VARCHAR(200)
) BEGIN	
	SELECT proc, CASE WHEN (changed=1 OR NOT (exists(SELECT ROUTINE_BODY
	FROM information_schema.routines
	WHERE 1=1 AND ROUTINE_SCHEMA=_schema AND ROUTINE_NAME=_name))) THEN 1 ELSE 0 END AS changed
	FROM tv_$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
END
`;
            //WHERE 1=1 AND ROUTINE_SCHEMA COLLATE utf8_general_ci=_schema COLLATE utf8_general_ci AND ROUTINE_NAME COLLATE utf8_general_ci=_name COLLATE utf8_general_ci))) THEN 1 ELSE 0 END AS changed
            yield this.exec(getProc, undefined);
            const saveProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.tv_$proc_save;
CREATE PROCEDURE \`${db}\`.tv_$proc_save(
	_schema VARCHAR(200),
	_name VARCHAR(200),
	_proc TEXT
) 
__proc_exit: BEGIN
	DECLARE _procOld TEXT;DECLARE _changed TINYINT;
	IF _proc IS NULL THEN
	UPDATE tv_$proc SET changed=0 WHERE name=_name;
	LEAVE __proc_exit;
	END IF;
	SELECT proc INTO _procOld
	FROM tv_$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
	SET _changed=1;
	IF _procOld IS NULL THEN
	INSERT INTO tv_$proc (name, proc, changed) 
		VALUES (_name, _proc, 1);
	ELSEIF binary _proc=_procOld THEN
		SET _changed=0;
	ELSE
	UPDATE tv_$proc SET proc=_proc, changed=1 
		WHERE name=_name;
	END IF;
	SELECT CASE WHEN (_changed=1 OR NOT (exists(SELECT ROUTINE_BODY
	FROM information_schema.routines 
	WHERE 1=1 AND ROUTINE_SCHEMA=_schema AND ROUTINE_NAME=_name))) THEN 1 ELSE 0 END AS changed;
END
`;
            //WHERE 1=1 AND ROUTINE_SCHEMA COLLATE utf8_general_ci=_schema COLLATE utf8_general_ci AND ROUTINE_NAME COLLATE utf8_general_ci=_name COLLATE utf8_general_ci))) THEN 1 ELSE 0 END AS changed;
            yield this.exec(saveProc, undefined);
            return;
        });
    }
    create$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = this.sqlExists('$uq');
            // 'SELECT SCHEMA_NAME as sname FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'$uq\'';
            let rows = yield this.exec(exists, undefined);
            if (rows.length == 0) {
                let sql = 'CREATE DATABASE IF NOT EXISTS $uq'; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
                yield this.exec(sql, undefined);
            }
            let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), create_time timestamp not null default current_timestamp, uid bigint not null default 0, primary key(`name`), unique key unique_id (id))';
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
			insert into \`log\` (\`time\`, unit, uq, subject, content) 
				values (_time, _unit, 
					(select id from uq where \`name\`=_uq), 
					_subject, 
					_content);
            leave _exit;
		else
			set _time = ADDDATE(_time,interval 1 microsecond );
		end if;
	end loop;
end;
        `;
            let performanceLog = `
create procedure $uq.performance(_tick bigint, _log text, _ms int) begin
    declare _t timestamp(6);
    set _t = from_unixtime(_tick/1000);
    _loop: while 1=1 do
        insert ignore into performance (\`time\`, log, ms) values (_t, _log, _ms);
        if row_count()>0 then
            leave _loop; 
        end if;
        set _t=date_add(_t, interval 1 microsecond);
    end while;
end;
`;
            let versionResults = yield this.sql('information_schema', 'use information_schema; select version() as v', []);
            let versionRows = versionResults[1];
            let version = versionRows[0]['v'];
            if (version >= '8.0') {
                _.merge(sqls, sqls_8);
            }
            else {
                _.merge(sqls, sqls_5);
            }
            let retProcExists = yield this.exec(sqls.procExists, undefined);
            if (retProcExists.length === 0) {
                yield this.exec(writeLog, undefined);
            }
            let retPerformanceExists = yield this.exec(sqls.performanceExists, undefined);
            if (retPerformanceExists.length === 0) {
                yield this.exec(performanceLog, undefined);
            }
            let uid = `
CREATE FUNCTION $uq.uid(uqName VARCHAR(200))
RETURNS bigint(20)
LANGUAGE SQL
DETERMINISTIC
MODIFIES SQL DATA
SQL SECURITY DEFINER
COMMENT ''
BEGIN
	DECLARE id, saved BIGINT;
	SET id = (UNIX_TIMESTAMP()<<18);
	IF uqName IS NULL THEN
		SET uqName='$uid';
	END IF;
	SELECT cast(uid as SIGNED) into saved FROM $uq.uq where \`name\`=uqName FOR update;
	IF saved IS NULL THEN
		INSERT IGNORE INTO $uq.uq (name, uid) VALUES ('$uid', id);
		SET saved=id;
	END IF;
	IF id<=saved THEN
		SET id=saved+1;
	END IF;
	UPDATE $uq.uq SET uid=id WHERE \`name\`=uqName;
	RETURN id;
END
`;
            let retUidExists = yield this.exec(sqls.uidExists, undefined);
            if (retUidExists.length === 0) {
                yield this.exec(uid, undefined);
            }
            let dateToUid = `
CREATE FUNCTION $uq.DateToUid(
	_date DATETIME
)
RETURNS bigint(20)
LANGUAGE SQL
DETERMINISTIC
NO SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
	DECLARE ret BIGINT;
	SET ret=unix_timestamp(_date)<<18;
	RETURN ret;
END    
`;
            let retDateToUidExists = yield this.exec(sqls.dateToUidExists, undefined);
            if (retDateToUidExists.length === 0) {
                yield this.exec(dateToUid, undefined);
            }
            let uidToDate = `
CREATE FUNCTION $uq.UidToDate(
	_uid BIGINT
)
RETURNS DATETIME
LANGUAGE SQL
DETERMINISTIC
NO SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
	DECLARE ret DATETIME;
	SET ret=from_unixtime(_uid>>18);
	RETURN ret;
END    
`;
            let retUidToDateExists = yield this.exec(sqls.uidToDateExists, undefined);
            if (retUidToDateExists.length === 0) {
                yield this.exec(uidToDate, undefined);
            }
            let addUqUidColumnExists = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'uid';`;
            let addUqUidColumn = `ALTER TABLE $uq.uq ADD uid bigint NOT NULL default '0';`;
            let retAddUqUidColumnExists = yield this.exec(addUqUidColumnExists, undefined);
            if (retAddUqUidColumnExists.length === 0) {
                yield this.exec(addUqUidColumn, undefined);
            }
        });
    }
    insertInto$Uq(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
            yield this.exec(insertUqDb, undefined);
        });
    }
    createDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'CREATE DATABASE IF NOT EXISTS `' + db + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
            yield this.exec(sql, undefined);
        });
    }
    existsDatabase(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.sqlExists(db);
            // 'SELECT SCHEMA_NAME as sname FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = \'' + db + '\'';
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
            let sql = db_1.env.isDevelopment === true ?
                `select name as db from $uq.uq WHERE name<>'$uid';` :
                `select name as db 
	            from $uq.uq 
				where name<>'$uid' AND
					not exists(SELECT \`name\` FROM $uq.setting WHERE \`name\`='debugging_jobs' AND \`value\`='yes' AND UNIX_TIMESTAMP()-unix_timestamp(update_time)<600);`;
            let rows = yield this.exec(sql, undefined);
            return rows;
        });
    }
    createResDb(resDbName) {
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
            DROP PROCEDURE IF EXISTS ${resDbName}.createItem;
            CREATE PROCEDURE ${resDbName}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
            BEGIN
                insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
                select last_insert_id() as id;
            END;
        `;
            yield this.exec(proc, undefined);
            proc = `
            DROP PROCEDURE IF EXISTS ${resDbName}.useItem;
            CREATE PROCEDURE ${resDbName}.useItem(_id int)
            BEGIN
                update item set useDate=now() where id=_id;
            END;
        `;
            yield this.exec(proc, undefined);
        });
    }
    IDActs(paramIDActs) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    ID(paramID) {
        return __awaiter(this, void 0, void 0, function* () {
            let { IDX, id } = paramID;
            let { db, name, fields } = IDX[0];
            let tables = `\`${db}\`.\`tv_${name}\` as t0`;
            let cols = 't0.id';
            for (let f of fields) {
                let fn = f.name;
                if (fn === 'id')
                    continue;
                cols += `,t0.\`${fn}\``;
            }
            let len = IDX.length;
            for (let i = 1; i < len; i++) {
                let { name, fields } = IDX[i];
                tables += ` left join \`${db}\`.\`tv_${name}\` as t${i} on t0.id=t${i}.id`;
                for (let f of fields) {
                    let fn = f.name;
                    if (fn === 'id')
                        continue;
                    cols += `,t${i}.\`${fn}\``;
                }
            }
            let where = typeof id === 'number' ?
                '=' + id
                :
                    ` in (${(id.join(','))})`;
            let sql = `SELECT ${cols} FROM ${tables} WHERE t0.id${where}`;
            let ret = yield this.exec(sql, undefined);
            return ret;
        });
    }
    KeyID(paramKeyID) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    ID2(paramID2) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    KeyID2(paramKeyID2) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    IDLog(paramIDLog) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
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