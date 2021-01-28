import { ParamID, ParamID2, ParamIDActs, ParamIDDetail, ParamIDLog, ParamKeyID, ParamKeyID2, TableSchema } from "../dbServer";
import { Builder } from "./builder";

export class MyBuilder extends Builder {
	IDActs(param:ParamIDActs): string {
		return
	}

	IDDetail(param:ParamIDDetail): string {
		let {ID, IDDetail, IDDetail2, IDDetail3} = param;
		let sql = this.buildInsertID(ID.name, '@id:=tv_$id()', ID.fields, ID.values);
		sql += this.buildInsertDetailID(IDDetail);
		sql += this.buildInsertDetailID(IDDetail2);
		sql += this.buildInsertDetailID(IDDetail3);
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
		let {ID, IDX, key, page} = param;
		let {cols, tables} = this.buildIDX(IDX);
		let where = '';
		let sql = `SELECT ${cols} FROM ${tables} WHERE t0.id${where}`;
		return sql;
	}

	ID2(param: ParamID2): string {
		return
	}
	
	KeyID2(param: ParamKeyID2): string {
		return
	}
	
	IDLog(param: ParamIDLog): string {
		return
	}

	private buildIDX(IDX: TableSchema[]): {cols: string; tables: string} {
		let {db, name, fields} = IDX[0];
		let tables = `\`${db}\`.\`tv_${name}\` as t0`;
		let cols = 't0.id';
		for (let f of fields) {
			let fn = f.name;
			if (fn === 'id') continue;
			cols += `,t0.\`${fn}\``;
		}
		let len = IDX.length;
		for (let i=1; i<len; i++) {
			let {name, fields} = IDX[i];
			tables += ` left join \`${db}\`.\`tv_${name}\` as t${i} on t0.id=t${i}.id`;
			for (let f of fields) {
				let fn = f.name;
				if (fn === 'id') continue;
				cols += `,t${i}.\`${fn}\``;
			}
		}
		return {cols, tables};
	}

	private buildInsertID(table:string, id:string, fields:{name:string}[], values:any): string {
		let cols = '', vals = '';
		for (let f of fields) {
			let {name} = f;
			if (name === 'id') continue;
			cols += ',`' + name + '`';
			if (name === 'no') {
				vals += ',tv_$no';
				continue;
			}
			let v = values[name];
			if (v === undefined) v = null;
			vals += ',\'' + v + '\'';
		}
		let sql = `insert into \`tv_${table}\` (\`id\`${cols}) values (${id}${vals});\n`;
		return sql;
	}

	private buildInsertDetailID(detail:TableSchema): string {
		if (!detail) return '';
		let {name, fields, values} = detail;
		let sql = 'set @row=0;\n';
		for (let value of values) {
			let cols = '', vals = '';
			for (let f of fields) {
				let {name} = f;
				if (name === 'id') continue;
				cols += ',`' + name + '`';
				switch (name) {
					case 'master':
						vals += ',@id';
						break;
					case 'row':
						vals += ',@row:=@row+1';
						break;
					default:					
						let v = value[name];
						if (v === undefined) v = null;
						vals += ',\'' + v + '\'';
						break;
				}
			}
			sql += `insert into \`tv_${name}\` (\`id\`${cols}) values (tv_$id()${vals});\n`;
		}
		return sql;
	}
}
