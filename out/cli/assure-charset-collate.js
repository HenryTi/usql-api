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
const config = require("config");
const mysql_1 = require("mysql");
const const_connection = 'connection';
const pool = mysql_1.createPool(config.get(const_connection));
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
function charsetCollateColumn(dbName, tableName, columnName, datatype, charset, collate) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Column: ' + columnName + ' ' + datatype);
        let sql = `ALTER TABLE \`${dbName}\`.\`${tableName}\` MODIFY \`${columnName}\` ${datatype} CHARACTER SET ${charset} COLLATE ${collate};`;
        yield runSql(sql);
    });
}
const stringTypes = ['varchar', 'char', 'tinytext', 'text', 'mediumtext', 'longtext'];
function charsetCollateTable(dbName, tableName, charset, collate) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Table: ' + tableName);
        let sql = `ALTER TABLE \`${dbName}\`.\`${tableName}\` CONVERT TO CHARACTER SET ${charset} COLLATE ${collate};`;
        yield runSql(sql);
        let sqlColumns = `select COLUMN_NAME, DATA_TYPE, COLUMN_TYPE from information_schema.COLUMNS where TABLE_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`;
        let columns = yield runSql(sqlColumns);
        for (let col of columns) {
            let { COLUMN_NAME, COLUMN_TYPE, DATA_TYPE } = col;
            if (stringTypes.indexOf(DATA_TYPE) >= 0) {
                yield charsetCollateColumn(dbName, tableName, COLUMN_NAME, COLUMN_TYPE, charset, collate);
            }
        }
        console.log('-');
    });
}
function charsetCollateDb(dbName, charset, collate) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== charsetCollateDb: ' + dbName + ' ' + charset + ' ' + collate);
        let sql = `ALTER DATABASE \`${dbName}\` CHARACTER SET ${charset} COLLATE ${collate};`;
        yield runSql(sql);
        let sqlTables = `select TABLE_NAME from information_schema.TABLES where TABLE_SCHEMA='${dbName}'`;
        let tables = yield runSql(sqlTables);
        for (let tblRow of tables) {
            yield charsetCollateTable(dbName, tblRow['TABLE_NAME'], charset, collate);
        }
        console.log('-');
        console.log('-');
    });
}
function charsetCollateAllDbs(charset, collate) {
    return __awaiter(this, void 0, void 0, function* () {
        yield charsetCollateDb('$res', charset, collate);
        yield charsetCollateDb('$uq', charset, collate);
        let sqlDbs = `select name from \`$uq\`.uq order by id asc`;
        let dbs = yield runSql(sqlDbs);
        for (let dbRow of dbs) {
            let { name: dbName } = dbRow;
            yield charsetCollateDb(dbName, charset, collate);
        }
    });
}
const charset = {
    "character_set_client": "utf8mb4",
    "character_set_connection": "utf8mb4",
    //"character_set_database": "utf8mb4",
    "character_set_results": "utf8mb4",
    "character_set_server": "utf8mb4",
};
const collation = {
    "collation_connection": "utf8mb4_0900_ai_ci",
    //"collation_database": "utf8mb4_0900_ai_ci",
    "collation_server": "utf8mb4_0900_ai_ci",
    "default_collation_for_utf8mb4": "utf8mb4_0900_ai_ci",
};
function dbServerParams() {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = {};
        let results = yield runSql(`SHOW VARIABLES LIKE '%char%';SHOW VARIABLES LIKE '%collat%';select database();`);
        setParams(ret, results[0]);
        setParams(ret, results[1]);
    });
}
function setParams(params, tbl) {
    for (let row of tbl) {
        let name = row['Variable_name'];
        let value = row['Value'];
        params[name] = value;
    }
}
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        process.env.NODE_ENV = 'development';
        let params = dbServerParams();
        console.log(params);
        let charset = 'utf8mb4';
        let collate = 'utf8mb4_general_ci';
        /*
            await charsetCollateDb('$res', charset, collate);
            await charsetCollateDb('$uq', charset, collate);
            // await charsetCollateDb('chemical$test', charset, collate);
        */
        console.log('=== Job done!');
        process.exit(0);
    });
})();
//# sourceMappingURL=assure-charset-collate.js.map