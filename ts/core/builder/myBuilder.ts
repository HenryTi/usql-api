import { ParamID, ParamID2, ParamIDActs, ParamIDDetail, ParamIDDetailGet, ParamIDLog, ParamIDSum, ParamKeyID, ParamKeyID2, TableSchema } from "../dbServer";
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
				case 'id2': sql += this.buildSaveID2(p); break;
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
		let {IDX, id} = param;
		let {cols, tables} = this.buildIDX(IDX);
		let where = typeof id === 'number'? 
			'=' + id
			:
			` in (${(id.join(','))})`;
		let sql = `SELECT ${cols} FROM ${tables} WHERE t0.id${where}`;
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

	ID2(param: ParamID2): string {
		let {ID2, id, IDX, page} = param;
		let arr = [ID2];
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
	
	KeyID2(param: ParamKeyID2): string {
		let {ID, ID2, key, IDX, page} = param;
		let arr = [ID2];
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
		let {IDX, field, id, log, timeZone, page} = param;
		field = field.toLowerCase();
		let {start, size, end} = page;
		if (!start) start = Number.MAX_SAFE_INTEGER;
		let {name, schema} = IDX;
		let {exFields} = schema;
		let exField = exFields?.find(v => v.field === field);
		let table = '`tv_' + name + '$' + field + '`';
		let cols = 't, v, u';
		if (exField) {
			let {log, track, memo, sum} = exField;
			if (log !== true) {
				return `select 'IDX ${name} ${field}' is not loged`;
			}
			if (sum !== undefined) cols += ',s';
			if (track === true) cols += ',k';
			if (memo === true) cols += ',m';
		}
		let group:string;
		let time = `from_unixtime(a.t/1000+${timeZone}*3600)`;
		switch (log) {
			default:
				return `select 'IDX ${name} ${field}' log ${log} unknown`;
			case 'each':
				return `SELECT ${cols} FROM ${table} WHERE id=${id} AND t<${start} ORDER BY t DESC LIMIT ${size}`;
			case 'day': group = `DATE_FORMAT(${time}, '%Y-%m-%d')`; ; break;
			case 'week': group = `YEARWEEK(${time}, 2)`; break;
			case 'month': group = `DATE_FORMAT(${time}, '%Y-%m-01')`; break;
			case 'year': group = `DATE_FORMAT(${time}, '%Y-01-01')`; break;
		}
		let sql = `select ${group} as t, sum(a.v) as v from ${table} as a where a.t>=${end} and a.t<${start} and a.id=${id} group by ${group} limit ${size}`;
		return sql;
	}

	IDSum(param: ParamIDSum): string {
		let {IDX, field, id, far, near} = param;
		field = field.toLowerCase();
		if (!far) far = 0;
		if (!near) near = Number.MAX_SAFE_INTEGER;
		let {name, schema} = IDX;
		let {exFields} = schema;
		let exField = exFields?.find(v => v.field === field);
		let sql: string;
		if (!exField) {
			sql = `select '${field} is not logged' as error`;
		}
		else {
			let table = '`tv_' + name + '$' + field + '`';
			sql = `select a.id, sum(a.v) as v from ${table} as a where a.t>=${far} and a.t<${near} and a.id`;
			if (Array.isArray(id) === true) {
				sql += ' in (' + (id as number[]).join() + ')';
			}
			else {
				sql += `=${id}`;
			}
		}
		return sql;
	}

	private buildIDX(IDX: TableSchema[]): {cols: string; tables: string} {
		let {name, schema} = IDX[0];
		let {type} = schema;
		let idJoin = type === 'id2'? 'id2' : 'id';
		let tables = `\`${this.dbName}\`.\`tv_${name}\` as t0`;
		let cols = 't0.id';
		for (let f of schema.fields) {
			let {name:fn, type:ft} = f;
			if (fn === 'id') continue;
			let fv = `t0.\`${fn}\``;
			cols += ',';
			cols += ft === 'textid'? `tv_$idtext(${fv})` : fv;
			cols += ' as `' + fn + '`';
		}
		let len = IDX.length;
		for (let i=1; i<len; i++) {
			let {name, schema} = IDX[i];
			tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${i} on t0.${idJoin}=t${i}.id`;
			for (let f of schema.fields) {
				let {name:fn, type:ft} = f;
				if (fn === 'id') continue;
				let fv = `t${i}.\`${fn}\``;
				cols += ',';
				cols += ft === 'textid'? `tv_$idtext(${fv})` : fv;
				cols += ' as `' + fn + '`';
			}
		}
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

	private buildSaveID2(ts:TableSchema): string {
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
					time = v.time;
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
						let {field, track, memo, sum} = exField;
						let valueId = value['id'];
						let sqlEx = `set @dxValue=\`tv_${tableName}$${field}\`(@unit,@user,${valueId},0,${v},`;
						sqlEx += time !== undefined? time : 'null';
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
			sql += 'id2=';
			if (id2 < 0) id2 = -id2;
			sql += id2;
		}
		sql += ';\n';
		return sql;
	}
}
