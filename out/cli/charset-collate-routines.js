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
//process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'devdo';
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        let node_env;
        let db;
        process.argv.forEach(v => {
            let parts = v.split('=');
            if (parts.length === 2) {
                let v = parts[1].trim().toLowerCase();
                switch (parts[0].trim().toLowerCase()) {
                    case 'node_env':
                        node_env = v;
                        break;
                    case 'db':
                        db = v;
                        break;
                }
            }
        });
        if (node_env)
            process.env.NODE_ENV = node_env;
        console.log('node_env=' + node_env + ', ' + 'db = ' + db);
        const config = require('config');
        console.log('NODE_ENV ' + process.env.NODE_ENV);
        if (!process.env.NODE_ENV) {
            console.error('node out/cli/charset-collate-routines node_env=???');
            process.exit(0);
        }
        const const_connection = 'connection';
        const config_connection = config.get(const_connection);
        console.log(config_connection);
        const pool = mysql_1.createPool(config_connection);
        function runSql(sql) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    let handler = (err, results) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(results);
                    };
                    pool.query(sql, handler);
                });
            });
        }
        function charsetCollateRoutine(dbName, routineName, type, sql) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('ROUTINE: ' + routineName);
                let sqlDrop = `DROP ${type} IF EXISTS \`${dbName}\`.\`${routineName}\`;`;
                yield runSql(sqlDrop);
                yield runSql(sql);
                // console.log('-');
            });
        }
        function charsetCollateDb(dbName, charset, collate) {
            return __awaiter(this, void 0, void 0, function* () {
                let sqlDbFileNames = `select SCHEMA_NAME from information_schema.SCHEMATA where SCHEMA_NAME=LOWER('${dbName}')`;
                let dbFileNames = yield runSql(sqlDbFileNames);
                if (dbFileNames.length === 0) {
                    console.log(`Database ${dbName} not exists`);
                    return;
                }
                dbName = dbFileNames[0]['SCHEMA_NAME'];
                console.log('=== charsetCollateDb: ' + dbName + ' ' + charset + ' ' + collate);
                yield runSql(`use \`${dbName}\`;`);
                let sqlRoutines = `
		SELECT \`name\`, \`type\`, sql_stmt 
		FROM (
		  select p.db, p.name, p.type, 3 as intord, p.character_set_client,
			concat('CREATE DEFINER=\`',replace(p.definer,'@','\`@\`'),'\` ',
			  p.type, 
			  ' ',p.db,'.\`',p.name,
			  '\`(',convert(p.param_list USING utf8),') ',
			  case 
				when length(p.returns) > 1 
				then concat(' RETURNS ', convert(p.returns USING utf8))
				else '' 
			  end, ' \n',
			  case 
				when p.is_deterministic = 'YES' then '\tDETERMINISTIC\n' 
				else '' 
			  end,
			  case 
				when p.language = 'SQL' THEN ''
				else concat('\tLANGUAGE ',p.language, '\n')
			  end,
			  case 
				when p.sql_data_access = 'CONTAINS_SQL' THEN ''
				when p.sql_data_access = 'NO_SQL' THEN '\tNO SQL\n'
				when p.sql_data_access = 'READS_SQL_DATA' THEN '\tREADS SQL DATA\n'
				when p.sql_data_access = 'MODIFIES_SQL_DATA' THEN '\tMODIFIES SQL DATA\n'
				else concat('\t',replace(p.sql_data_access,'_', ' '), '\n')
			  end,
			  case when p.security_type <> 'DEFINER' 
				then concat('\tSQL SECURITY ', p.security_type, '\n')
				else '' 
			  end,
			  case when p.comment <> '' 
				then concat('\tCOMMENT ''', 
				  replace(replace(p.comment,'''',''''''),'\n','\\n')
				  ,'''')
				else '' 
			  end, '\n',
			  convert(p.body USING utf8),
			  ';'
			) as sql_stmt
		  from mysql.proc p
		) sql_stmts
		where db = '${dbName}'
		-- and type = 'function'
		-- and character_set_client = 'utf8'
		order by db, name, type, intord;
`;
                let routines = yield runSql(sqlRoutines);
                for (let routineRow of routines) {
                    let { name, type, sql_stmt } = routineRow;
                    yield charsetCollateRoutine(dbName, name, type, sql_stmt);
                }
                console.log('-');
                console.log('-');
            });
        }
        function charsetCollateAllUqs(charset, collate, dbIdStart) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!dbIdStart)
                    dbIdStart = 0;
                let sqlDbs = `select name from \`$uq\`.uq where id>${dbIdStart} order by id asc`;
                let dbs = yield runSql(sqlDbs);
                for (let dbRow of dbs) {
                    let { name: dbName } = dbRow;
                    yield charsetCollateDb(dbName, charset, collate);
                }
            });
        }
        function dbServerParams() {
            return __awaiter(this, void 0, void 0, function* () {
                let ret = {};
                let results = yield runSql(`SHOW VARIABLES LIKE '%char%';SHOW VARIABLES LIKE '%collat%';select database();`);
                setParams(ret, results[0]);
                setParams(ret, results[1]);
                return ret;
            });
        }
        function setParams(params, tbl) {
            for (let row of tbl) {
                let name = row['Variable_name'];
                let value = row['Value'];
                params[name] = value;
            }
        }
        try {
            let params = yield dbServerParams();
            console.log(params);
            console.log('');
            console.log('========================================');
            let charset = params['character_set_connection']; //'utf8mb4';
            let collate = params['collation_connection']; //'utf8mb4_general_ci';
            if (db) {
                yield charsetCollateDb(db, charset, collate);
            }
            else {
                let dbIdStart = 0; // 有些数据库升级的时候，出错的。从出错地方重新开始。
                if (!dbIdStart) {
                    yield charsetCollateDb('$res', charset, collate);
                    yield charsetCollateDb('$uq', charset, collate);
                }
                yield charsetCollateAllUqs(charset, collate, dbIdStart);
            }
            console.log('=== Job done!');
        }
        catch (err) {
            console.error(err);
        }
        process.exit(0);
    });
})();
//# sourceMappingURL=charset-collate-routines.js.map