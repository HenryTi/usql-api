import { ParamID, ParamIX, ParamIDActs, ParamIDDetail, ParamIDDetailGet, ParamIDLog, 
	ParamKeyID, ParamKeyIX, 
	ParamIDSum, ParamKeyIDSum, ParamIXSum, ParamKeyIXSum,
	TableSchema, 
	ParamSum, EntitySchema, ParamIDinIX} from "../dbServer";
import { Builder } from "./builder";

const retLn = `set @ret=CONCAT(@ret, '\\n');\n`;
const retTab = `set @ret=CONCAT(@ret, @id, '\\t');\n`;

export class MyBuilder extends Builder {
	IDActs(param:ParamIDActs): string {
		let {$} = param;
		let arr = $ as unknown as string[];
		let sql = 'set @ret=\'\';\n';
		for (let i=0; i<arr.length; i++) {
			let p = param[arr[i]];
			switch (p.schema.type) {
				case 'id': sql += this.buildSaveID(p); break;
				case 'idx': sql += this.buildSaveIDX(p); break;
				case 'ix': sql += this.buildSaveIX(p); break;
			}
		}
		return sql + 'select @ret as ret;\n';
	}

	IDDetail(param:ParamIDDetail): string {
		let {master, detail, detail2, detail3} = param;
		let masterOverride = {
			id: `(@master:=@id:=tv_$id(${master.schema.typeId}))`,
			no: `tv_$no(@unit, '${master.name}')`,
		}
		let sql = 'SET @ret=\'\';\n';
		sql += this.buildInsert(master, masterOverride);
		let detailOverride = {
			id: `(@id:=tv_$id(${detail.schema.typeId}))`,
			master: '@master',
			row: '(@row:=@row+1)',
		}
		sql += this.buildInsert(detail, detailOverride);
		if (detail2) {
			let detailOverride2 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail2.schema.typeId}))`,
			}
			sql += this.buildInsert(detail2, detailOverride2);
		}
		if (detail3) {
			let detailOverride3 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail3.schema.typeId}))`,
			}
			sql += this.buildInsert(detail3, detailOverride3);
		}
		sql += 'SELECT @ret as ret;\n';
		return sql;
	}

	IDDetailGet(param:ParamIDDetailGet): string {
		let {id, master, detail, detail2, detail3} = param;
		let sql = this.buildDetailSelect(master, '`id`='+id);
		let whereMaster = '`master`=' + id;
		sql += this.buildDetailSelect(detail, whereMaster);
		sql += this.buildDetailSelect(detail2, whereMaster);
		sql += this.buildDetailSelect(detail3, whereMaster);
		return sql;
	}

	ID(param: ParamID): string {
		let {IDX, id, page} = param;
		let {cols, tables} = this.buildIDX(IDX);
		let where:string = '';
		let limit:string = '';
		if (id !== undefined) {
			where = 't0.id' + (typeof id === 'number'? 
				'=' + id
				:
				` in (${(id.join(','))})`);
		}
		else {
			where = '1=1'
		}
		if (page !== undefined) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ` AND t0.id>${start}`;
			limit = `limit ${size}`;
		}
		let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
		return sql;
	}

	KeyID(param: ParamKeyID): string {
		let {ID, key, IDX, page} = param;
		let arr = [ID];
		if (IDX) arr.push(...IDX);
		let {cols, tables} = this.buildIDX(arr);
		let {schema} = ID;
		let {keys} = schema;
		let where = '';
		if (this.hasUnit === true) {
			where += 't0.$unit=@unit'
		}
		for (let k of keys) {
			let v = key[k.name];
			if (v === undefined) break;
			where += ' AND t0.`' + k.name + '`=\'' + v + '\'';
		}
		if (page) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ' AND t0.id>' + start;
		}

		let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.id ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}

	IX(param: ParamIX): string {
		let {IX, id, IDX, page} = param;
		let arr = [IX];
		if (IDX) arr.push(...IDX);
		let {cols, tables} = this.buildIDX(arr);
		let where = ' AND t0.id' + (Array.isArray(id)?
			' in (' + id.join(',') + ')'
			:
			'=' + id);
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ' AND t0.id2>' + start;
		}
		let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.id2 ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
	
	KeyIX(param: ParamKeyIX): string {
		let {ID, IX, key, IDX, page} = param;
		let arr = [IX];
		if (IDX) arr.push(...IDX);
		let {cols, tables} = this.buildIDX(arr);

		let {name, schema} = ID;
		let {keys} = schema;
		let joinID = ' JOIN `tv_' + name + '` as t ON t.id=t0.id';
		let where = '';
		if (this.hasUnit === true) {
			where += 't.$unit=@unit'
		}
		for (let k of keys) {
			let v = key[k.name];
			if (v === undefined) break;
			where += ' AND t.`' + k.name + '`=\'' + v + '\'';
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ' AND t0.id2>' + start;
		}
		let sql = `SELECT ${cols} FROM ${tables}${joinID} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.id2 ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
	
	IDLog(param: ParamIDLog): string {
		let {IDX, field, id, log, timeZone, page, far, near} = param;
		field = field.toLowerCase();
		let {start, size} = page;
		if (!start) start = Number.MAX_SAFE_INTEGER;
		let {name, schema} = IDX;
		let {exFields} = schema;
		let exField = exFields?.find(v => v.field === field);
		let span = '';
		if (far) span += ` AND a.t>=${far}`;
		if (near) span += ` AND a.t<${near}`;
		let table = '`tv_' + name + '$' + field + '`';
		let cols = 'a.t, a.v, a.u';
		if (exField) {
			let {log, track, memo, sum} = exField;
			if (log !== true) {
				return `select 'IDX ${name} ${field}' is not loged`;
			}
			if (sum === true) cols += ',a.s';
			if (track === true) cols += ',a.k';
			if (memo === true) cols += ',a.m';
		}
		let group:string;
		let time = `from_unixtime(a.t/1000+${timeZone}*3600)`;
		switch (log) {
			default:
				return `select 'IDX ${name} ${field}' log ${log} unknown`;
			case 'each':
				return `SELECT ${cols} FROM ${table} as a WHERE a.id=${id} AND a.t<${start} ${span} ORDER BY a.t DESC LIMIT ${size}`;
			case 'day': group = `DATE_FORMAT(${time}, '%Y-%m-%d')`; ; break;
			case 'week': group = `YEARWEEK(${time}, 2)`; break;
			case 'month': group = `DATE_FORMAT(${time}, '%Y-%m-01')`; break;
			case 'year': group = `DATE_FORMAT(${time}, '%Y-01-01')`; break;
		}
		let sql = `select ${group} as t, sum(a.v) as v from ${table} as a where a.t<${start} and a.id=${id} ${span} group by ${group} limit ${size}`;
		return sql;
	}

	IDSum(param: ParamIDSum): string {
		let {id} = param;
		let sql = this.buildSumSelect(param);
		if (id !== undefined) {
			sql += ' where t.id';
			if (Array.isArray(id) === true) {
				sql += ' in (' + (id as number[]).join() + ')';
			}
			else {
				sql += `=${id}`;
			}
		}
		return sql;
	}

	KeyIDSum(param: ParamKeyIDSum): string {
		let {ID, key, page} = param;
		let sql = this.buildSumSelect(param);
		let {schema} = ID;
		let {keys} = schema;
		sql += ` RIGHT JOIN \`tv_${ID.name}\` as t0 ON t0.id=t.id WHERE 1=1`;
		if (this.hasUnit === true) {
			sql += ' AND t0.$unit=@unit';
		}
		for (let k of keys) {
			let v = key[k.name];
			if (v === undefined) break;
			sql += ' AND t0.`' + k.name + '`=\'' + v + '\'';
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			sql += ' AND t0.id>' + start;
		}
		sql += ' ORDER BY t0.id ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}

	IXSum(param: ParamIXSum): string {
		let {IX, id, page} = param;
		let sql = this.buildSumSelect(param);
		sql += ` RIGHT JOIN \`tv_${IX.name}\` as t0 ON t0.id=t.id WHERE 1=1`;
		if (this.hasUnit === true) {
			sql += ' AND t0.$unit=@unit';
		}
		sql = ' AND t0.id' + (Array.isArray(id)?
			' in (' + id.join(',') + ')'
			:
			'=' + id);
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			sql += ' AND t0.id2>' + start;
		}
		sql += ' ORDER BY t0.id2 ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}

	KeyIXSum(param: ParamKeyIXSum): string {
		let {ID, IX, key, IDX, page} = param;
		let sql = this.buildSumSelect(param);
		let {schema} = ID;
		let {keys} = schema;
		sql += ` RIGHT JOIN \`tv_${ID.name}\` as t0 ON t0.id=t.id`;
		sql += ` RIGHT JOIN \`tv_${IX.name}\` as t1 ON t0.id=t1.id`;
		if (this.hasUnit === true) {
			sql += ' AND t0.$unit=t1.$unit';
		}
		sql += ` WHERE 1=1`;
		if (this.hasUnit === true) {
			sql += ' AND t0.$unit=@unit';
		}
		for (let k of keys) {
			let v = key[k.name];
			if (v === undefined) break;
			sql += ' AND t0.`' + k.name + '`=\'' + v + '\'';
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			sql += ' AND t0.id>' + start;
		}
		sql += ' ORDER BY t0.id ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}

	IDinIX(param: ParamIDinIX): string {
		let {IX, ID, id, page} = param;
		let {cols, tables} = this.buildIDX([ID]);
		let where:string = '';
		let limit:string = '';
		where = '1=1';
		//where = 't0.id=' + id;
		if (page !== undefined) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ` AND t0.id>${start}`;
			limit = `limit ${size}`;
		}
		cols += `,case when exists(select id2 from \`tv_${IX.name}\` where id=${id} and id2=t0.id) then 1 else 0 end as $in`;
		
		let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
		return sql;
	}

	private buildSumSelect(param:ParamSum):string {
		let {IDX, far, near, field} = param;
		let {name, schema} = IDX;
		if (!far) far = 0;
		if (!near) near = Number.MAX_SAFE_INTEGER;
		let sql = 'select t.id';
		for (let f of field) {
			let {exFields} = schema;
			let exField = exFields?.find(v => v.field === f);
			if (exField === undefined) {
				return `select '${f} is not logged' as error`;
			}
			f = f.toLowerCase();
			sql += `,\`tv_${name}$${f}$sum\`(t.id,${far},${near}) as ${f}`;
		}
		sql += ` from \`tv_${name}\` as t`;
		return sql;
	}

	private buildIDX(IDX: TableSchema[]): {cols: string; tables: string} {
		let {name, schema} = IDX[0];
		let {type} = schema;
		let idJoin = type === 'ix'? 'id2' : 'id';
		let tables = `\`${this.dbName}\`.\`tv_${name}\` as t0`;
		let ti = `t0`;
		let cols = ti + '.id';
		function buildCols(schema:EntitySchema) {
			let {fields, exFields} = schema;
			for (let f of fields) {
				let {name:fn, type:ft} = f;
				if (fn === 'id') continue;
				let fv = `${ti}.\`${fn}\``;
				cols += ',';
				cols += ft === 'textid'? `tv_$idtext(${fv})` : fv;
				cols += ' as `' + fn + '`';
			}
		}
		buildCols(schema);
		let len = IDX.length;
		let $timeField:string;
		for (let i=1; i<len; i++) {
			let {name, schema} = IDX[i];
			tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${i} on t0.${idJoin}=t${i}.id`;
			let {type} = schema;
			ti = `t${i}`;
			buildCols(schema);
			if (type === 'idx' && $timeField === undefined) {
				$timeField = `,${ti}.\`$time\` as \`$time\``;
				$timeField += `,tv_$idtext(${ti}.\`$field\`) as \`$field\``;
				$timeField += `,${ti}.\`$value\` as \`$value\``;
			}
		}
		if ($timeField !== undefined) cols += $timeField;
		return {cols, tables};
	}

	private buildInsert(ts:TableSchema, override: any, valueItem?: any): string {
		if (!ts) return '';
		let {name, schema, values} = ts;
		let {fields, owner} = schema;
		if (!override) override = {};
		let sql = 'set @row=0;\n';
		let cols:string, vals:string;
		let first:boolean;
		if (this.hasUnit === true) {
			cols = '`$unit`';
			vals = '@unit';
			first = false;
		}
		else {
			cols = '';
			vals = '';
			first = true;
		}
		for (let f of fields) {
			let {name} = f;
			if (first === true) {
				first = false;
			}
			else {
				cols += ',';
			};
			cols += `\`${name}\``;
		}
		if (owner === true) {
			cols += ',`$owner`';
		}
		if (valueItem !== undefined) {
			values = [valueItem];
		}
		for (let value of values) {
			sql += `insert into \`tv_${name}\`\n\t(${cols})\n\tvalues\n\t`;
			first = true;
			vals = '';
			for (let f of fields) {
				let {name, type} = f;
				if (first === true) {
					first = false;
				}
				else {
					vals += ',';
				};
				let v = override[name];
				if (v !== undefined) {
					vals += v;
				}
				else {
					v = value[name];
					vals += v === undefined? 'null' : 
						(type==='textid'? `tv_$textid('${v}')`: `'${v}'`);
				}
			}
			if (owner === true) {
				vals += ',@user';
			}
			sql += `(${vals});\n`;
			sql += retTab;
		}
		sql += retLn;
		return sql;
	}

	private buildDetailSelect(ts:TableSchema, whereId:string):string {
		if (ts === undefined) return '';
		let sql = 'SELECT ';
		let first = true;
		for (let f of ts.schema.fields) {
			if (first === true) {
				first = false;
			}
			else {
				sql += ',';
			}
			let {name, type} = f;
			sql += (type === 'textid')?
				`tv_$idtext(\`${name}\`)`
				:
				`\`${name}\``;
		}
		sql += ' FROM `tv_' + ts.name + '` WHERE 1=1';
		if (this.hasUnit === true) {
			sql += ' AND `$unit`=@unit'
		}
		sql += ' AND ' + whereId;
		return sql + ';\n';
	}


	private buildSaveID(ts:TableSchema): string {
		let sql = '';
		let {values, name, schema} = ts;
		let {keys, fields} = schema;
		for (let value of values) {
			let {id} = value;
			if (id) {
				if (id<0) {
					sql += this.buildDelete(ts, -id);
				}
				else {
					sql += this.buildUpdate(ts, value);
				}
			}
			else {
				sql += `set @id=\`tv_${name}$id\`(@unit,@user,1`;
				let updateOverride = {id: '@id'};
				for (let k of keys) {
					let {name, type} = k;
					sql += ',';
					if (type === 'textid')
						sql += `tv_$textid('${value[name]}')`;
					else
						sql += `'${value[name]}'`;
					(updateOverride as any)[name] = null;
				}
				sql += ');\n'
				if (fields.length > keys.length + 1) {
					sql += this.buildUpdate(ts, value, updateOverride);
				}
				sql += retTab;
			}
		}
		sql += retLn;
		return sql;
	}

	private buildSaveIDX(ts:TableSchema): string {
		let sql = '';
		let {values} = ts;
		for (let value of values) {
			let {id} = value;
			if (id < 0) {
				sql += this.buildDelete(ts, -id);
			}
			else {
				sql += this.buildUpsert(ts, value);
			}

		}
		sql += retLn;
		return sql;
	}

	private buildSaveIX(ts:TableSchema): string {
		let sql = '';
		let {values} = ts;
		for (let value of values) {
			let {id, id2} = value;
			if (id < 0) {
				sql += this.buildDelete(ts, -id, id2);
			}
			else {
				sql += this.buildUpsert(ts, value);
			}
		}
		sql += retLn;
		return sql;
	}

	private buildUpsert(ts:TableSchema, value:any): string {
		let {name:tableName, schema} = ts;
		let {fields, exFields} = schema;
		let cols = '', vals = '', dup = '';
		let sqlWriteEx:string[] = [];
		let first = true;
		for (let f of fields) {
			let {name, type} = f;
			let v = value[name];
			let val:string;
			if (v === undefined || v === null) {
				val = 'null';
			}
			else {
				let time:number;
				if (typeof v === 'object') {
					time = v.$time;
					v = v.value;
				}
				val = (type==='textid'? `tv_$textid('${v}')`: `'${v}'`);
				switch (name) {
					default:
						if (dup.length > 0) dup += ',';
						dup += '`' + name + '`=values(`' + name + '`)';
						break;
					case 'id':
					case 'id2':
						break;
				}
				if (exFields) {
					let exField = exFields.find(v => v.field === name);
					if (exField !== undefined) {
						let {field, track, memo, sum, time:timeCanSet} = exField;
						let valueId = value['id'];
						let sqlEx = `set @dxValue=\`tv_${tableName}$${field}\`(@unit,@user,${valueId},0,${v},`;
						if (timeCanSet === true) {
							sqlEx += time !== undefined? time : 'null';
						}
						if (track === true) {
							let vTrack = value['$track'];
							sqlEx += ',' + (vTrack? vTrack : 'null');
						}
						if (memo === true) {
							let vMemo = value['$memo'];
							sqlEx += ',' + (vMemo? `'${vMemo}'` : 'null');
						}
						sqlEx += `);\n`;
						sqlWriteEx.push(sqlEx);
					}
				}
			}
			if (first === true) {
				first = false;
			}
			else {
				cols += ',';
				vals += ',';
			}
			cols += '\`' + name + '\`';
			vals += val;
		}
		let ignore = '', onDup = '';
		if (dup.length > 0) {
			onDup = `\non duplicate key update ${dup}`;
		}
		else {
			ignore = ' ignore';
		}
		let sql = `insert${ignore} into \`tv_${tableName}\` (${cols})\nvalues (${vals})${onDup};\n`;
		return sql + sqlWriteEx.join('');
	}

	private buildUpdate(ts:TableSchema, value:any, override:any = {}): string {
		let {name, schema} = ts;
		let {fields} = schema;
		let sql = 'update `tv_' + name + '` set ';
		let where = ' where 1=1';
		if (this.hasUnit === true) {
			where += ' and `$unit`=@unit';
		} 
		let first = true;
		for (let f of fields) {
			let {name, type} = f;
			let ov = override[name];
			if (ov === null) continue;
			let v = value[name];
			switch (name) {
				default: 
					if (first === true) {
						first = false;
					}
					else {
						sql += ',';
					}
					sql += '\`' + name + '\`=';
					if (ov !== undefined)
						v = ov;
					else if (v === undefined) {
						v = 'null';
					}
					else {
						v = (type==='textid'? `tv_$textid('${v}')`: `'${v}'`);
					}
					sql += v;
					break;
				case 'id':
					where += ' and id=' + (ov ?? v);
					break;
				case 'id2':
					where += ' and id2=' + (ov ?? v);
					break;
			}
		}
		return sql + where + ';\n';
	}

	private buildDelete(ts:TableSchema, id:number, id2?:number):string {
		let {name, schema} = ts;
		let {type, exFields} = schema;
		let sql = '';
		if (type === 'idx' && exFields) {
			for (let exField of exFields) {
				let {field, track, memo} = exField;
				let sqlEx = `set @dxValue=\`tv_${name}$${field}\`(@unit,@user,${id},-1,null`;
				if (track === true) {
					sqlEx += ',null';
				}
				if (memo === true) {
					sqlEx += ',null';
				}
				sqlEx += `);\n`;
				sql += sqlEx;
			}
		}
		sql += 'delete from `tv_' + name + '` where id=' + id;
		if (id2) {
			sql += ' AND id2=';
			if (id2 < 0) id2 = -id2;
			sql += id2;
		}
		sql += ';\n';
		return sql;
	}
}
