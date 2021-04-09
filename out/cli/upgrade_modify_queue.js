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
        process.env.NODE_ENV = node_env;
        const config = require('config');
        console.log('NODE_ENV ' + process.env.NODE_ENV);
        if (!process.env.NODE_ENV) {
            console.error('node out/cli/charset-collate node_env=???');
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
        try {
            console.log('');
            console.log('========================================');
            let sqlDbs = `select name from \`$uq\`.uq`;
            let dbs = yield runSql(sqlDbs);
            for (let db of dbs) {
                let { name: dbName } = db;
                let sqlHasModifyQueueMax = `SELECT * FROM information_schema.COLUMNS WHERE table_SCHEMA=${dbName} AND TABLE_NAME='tv_$unit' AND COLUMN_NAME='modifyQueueMax'`;
                let colModifyQueue = yield runSql(sqlHasModifyQueueMax);
                if (colModifyQueue.length > 0)
                    continue;
                let sqlAddCol = `ALTER TABLE ${dbName}.tv_$unit ADD modifyQueueMax BIGINT DEFAULT NULL;`;
                yield runSql(sqlAddCol);
                let sqlHasUnit = `SELECT * FROM information_schema.COLUMNS WHERE table_SCHEMA=${dbName} AND TABLE_NAME='tv_$modify_queue' AND COLUMN_NAME='$unit'`;
                let hasUnit = yield runSql(sqlHasUnit);
                if (hasUnit.length === 0) {
                    // 不带unit的表
                    let sqlAddIdIndex = `alter table ${dbName}.tv_$modify_queue add unique index $id_ix (id)`;
                    yield runSql(sqlAddIdIndex);
                    let sqlPrimaryKey = `alter table ${dbName}.tv_$modify_queue drop primary key, add primary key(entity, id);`;
                    yield runSql(sqlPrimaryKey);
                    let sqlSetModifyQueueMax = `
				UPDATE ${dbName}.tv_$unit AS t1
					SET t1.modifyQueueMax=(SELECT MAX(id) AS maxId FROM ${dbName}.tv_$modify_queue)
					WHERE t1.unit=24;`;
                    yield runSql(sqlSetModifyQueueMax);
                }
                else {
                    // 带unit的表
                    let sqlPrimaryKey = `alter table ${dbName}.tv_$modify_queue drop primary key, add primary key($unit, entity, id);`;
                    yield runSql(sqlPrimaryKey);
                    let sqlSetModifyQueueMax = `
				UPDATE ${dbName}.tv_$unit AS t1 INNER JOIN (SELECT $unit, MAX(id) AS maxId
				FROM ${dbName}.tv_$modify_queue
				GROUP BY $unit) AS t2 ON t1.unit=t2.$unit
				SET t1.modifyQueueMax=t2.maxId
				WHERE t1.unit>0;`;
                    yield runSql(sqlSetModifyQueueMax);
                }
            }
            console.log('=== Job done!');
        }
        catch (err) {
            console.error(err);
        }
        process.exit(0);
    });
})();
//# sourceMappingURL=upgrade_modify_queue.js.map