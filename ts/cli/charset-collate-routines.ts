import { createPool, MysqlError } from "mysql";

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
	if (node_env) process.env.NODE_ENV = node_env;
	console.log('node_env=' + node_env + ', ' + 'db = ' + db);

	const config:any = require('config');

	console.log('NODE_ENV ' + process.env.NODE_ENV);
	if (!process.env.NODE_ENV) {
		console.error('node out/cli/charset-collate-routines node_env=???');
		process.exit(0);
	}
	const const_connection = 'connection';
	const config_connection = config.get(const_connection);
	console.log(config_connection);
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
	
	async function charsetCollateRoutine(dbName:string, routineName:string, type:string, sql:string) {
		console.log('ROUTINE: ' + routineName);
		let sqlDrop = `DROP ${type} IF EXISTS \`${dbName}\`.\`${routineName}\`;`;
		await runSql(sqlDrop);
		await runSql(sql);
		// console.log('-');
	}
	
	async function charsetCollateDb(dbName:string, charset:string, collate:string) {
		let sqlDbFileNames = `select SCHEMA_NAME from information_schema.SCHEMATA where SCHEMA_NAME=LOWER('${dbName}')`;
		let dbFileNames:any[] = await runSql(sqlDbFileNames);
		if (dbFileNames.length === 0) {
			console.log(`Database ${dbName} not exists`);
			return;
		}
		dbName = dbFileNames[0]['SCHEMA_NAME'];

		console.log('=== charsetCollateDb: ' + dbName + ' ' + charset + ' ' + collate);

		await runSql(`use \`${dbName}\`;`);
	
		let sqlRoutines = `
		SELECT \`name\`, \`type\`, sql_stmt 
		FROM (
		  select p.db, p.name, p.type, 3 as intord, p.character_set_client,
			concat('CREATE DEFINER=\`',replace(p.definer,'@','\`@\`'),'\` ',
			  p.type, 
			  ' \`',p.db,'\`.\`',p.name,
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
		
		let routines:any[] = await runSql(sqlRoutines);
		for (let routineRow of routines) {
			let {name, type, sql_stmt} = routineRow;
			await charsetCollateRoutine(dbName, name, type, sql_stmt);
		}
		console.log('-');
		console.log('-');
	}
	
	async function charsetCollateAllUqs(charset:string, collate:string, dbIdStart:number) {
		if (!dbIdStart) dbIdStart = 0;
		let sqlDbs = `select name from \`$uq\`.uq where id>${dbIdStart} order by id asc`;
		let dbs:any[] = await runSql(sqlDbs);
		for (let dbRow of dbs) {
			let {name:dbName} = dbRow;
			await charsetCollateDb(dbName, charset, collate);
		}
	}
	
	async function dbServerParams(): Promise<any> {
		let ret:any = {};
		let results = await runSql(`SHOW VARIABLES LIKE '%char%';SHOW VARIABLES LIKE '%collat%';select database();`);
		setParams(ret, results[0]);
		setParams(ret, results[1]);
		return ret;
	}
	function setParams(params:any, tbl:any[]): void {
		for (let row of tbl) {
			let name = row['Variable_name'];
			let value = row['Value'];
			params[name] = value;
		}
	}
	
	try {
		let params = await dbServerParams();
		console.log(params);
		
		console.log('');
		console.log('========================================');

		let charset = params['character_set_connection']; //'utf8mb4';
		let collate = params['collation_connection']; //'utf8mb4_general_ci';

		if (db) {
			await charsetCollateDb(db, charset, collate);
		}
		else {
			let dbIdStart = 0; // 有些数据库升级的时候，出错的。从出错地方重新开始。
			if (!dbIdStart) {
				await charsetCollateDb('$res', charset, collate);
				await charsetCollateDb('$uq', charset, collate);
			}
		
			await charsetCollateAllUqs(charset, collate, dbIdStart);
		}

		console.log('=== Job done!');
	}
	catch (err) {
		console.error(err);
	}
	process.exit(0);
})();
