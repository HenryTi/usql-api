import { createPool, MysqlError } from "mysql";
import { logger } from '../tool';

//process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'devdo';

(async function() {
	let node_env:string;
	let db:string;

	process.argv.forEach(v => {
		let parts:string[] = v.split('=');
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
	
	if (!node_env && !process.env.NODE_ENV) {
		logger.error('node out/cli/upgrade-modify-queue node_env=???');
		process.exit(0);
	}

	if (node_env) {
		process.env.NODE_ENV = node_env;
	}

	logger.log('NODE_ENV ' + process.env.NODE_ENV);

	const config:any = require('config');

	const const_connection = 'connection';
	const config_connection = config.get(const_connection);
	logger.log(config_connection);
	const pool = createPool(config_connection);

	async function runSql(sql:string):Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let handler = (err: MysqlError | null, results?: any) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(results);
			}
			pool.query(sql, handler);
		});
	}
		
	try {
		logger.log('');
		logger.log('========================================');

		let sqlDbs = `select name from \`$uq\`.uq`;
		let dbs:any[] = await runSql(sqlDbs);
		for (let db of dbs) {
			try {
				let {name:dbName} = db;
				dbName = dbName.toLowerCase();
				let sqlHasModifyQueueMax = `SELECT * FROM information_schema.COLUMNS WHERE table_SCHEMA='${dbName}' AND TABLE_NAME='tv_$unit' AND COLUMN_NAME='modifyQueueMax'`;
				let colModifyQueue = await runSql(sqlHasModifyQueueMax);
				if (colModifyQueue.length > 0) {
					logger.log(`${dbName} already upgraded`);
					logger.log('\n');
					continue;
				}

				logger.log(`== begin upgrade ${dbName}`);
				let sqlAddCol = `ALTER TABLE ${dbName}.tv_$unit ADD modifyQueueMax BIGINT DEFAULT NULL;`;
				await runSql(sqlAddCol);
				logger.log(`${dbName} tv_$unit add modifyQueueMax column`);

				let sqlHasUnit = `SELECT * FROM information_schema.COLUMNS WHERE table_SCHEMA='${dbName}' AND TABLE_NAME='tv_$modify_queue' AND COLUMN_NAME='$unit'`;
				let hasUnit = await runSql(sqlHasUnit);
				if (hasUnit.length === 0) {
					// 不带unit的表
					let sqlAddIdIndex = `alter table ${dbName}.tv_$modify_queue add unique index $id_ix (id)`;
					await runSql(sqlAddIdIndex);
					logger.log(`${dbName} tv_$modify_queue add unique index $id_ix`);

					let sqlPrimaryKey = `alter table ${dbName}.tv_$modify_queue drop primary key, add primary key(entity, id);`;
					await runSql(sqlPrimaryKey);
					logger.log(`${dbName} tv_$modify_queue primary key (entity, id)`);

					let sqlSetModifyQueueMax = `
					UPDATE ${dbName}.tv_$unit AS t1
						SET t1.modifyQueueMax=(SELECT MAX(id) AS maxId FROM ${dbName}.tv_$modify_queue)
						WHERE t1.unit=24;`;
					await runSql(sqlSetModifyQueueMax);
					logger.log(`${dbName} set tv_$unit modifyQueueMax`);
				}
				else {
					// 带unit的表
					let sqlPrimaryKey = `alter table ${dbName}.tv_$modify_queue drop primary key, add primary key($unit, entity, id);`;
					await runSql(sqlPrimaryKey);
					logger.log(`${dbName} tv_$modify_queue primary key ($unit, entity, id)`);

					let sqlSetModifyQueueMax = `
					UPDATE ${dbName}.tv_$unit AS t1 INNER JOIN (SELECT $unit, MAX(id) AS maxId
					FROM ${dbName}.tv_$modify_queue
					GROUP BY $unit) AS t2 ON t1.unit=t2.$unit
					SET t1.modifyQueueMax=t2.maxId
					WHERE t1.unit>0;`;
					await runSql(sqlSetModifyQueueMax);
					logger.log(`${dbName} set tv_$unit modifyQueueMax`);
				}
				logger.log(`${dbName} done!`);
				logger.log('\n');
			}
			catch (err) {
				logger.error(err);
			}
		}

		logger.log('=== Job done!');
	}
	catch (err) {
		logger.error(err);
	}
	process.exit(0);
})();
