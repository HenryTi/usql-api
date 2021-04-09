import { ParamKeyID } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlKeyID extends MySqlBuilder {
	private param: ParamKeyID;

	constructor(builder: Builders, param: ParamKeyID) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, key, IDX, page} = this.param;
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
}
