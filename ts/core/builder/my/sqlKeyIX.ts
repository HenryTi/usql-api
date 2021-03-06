import { ParamKeyIX } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlKeyIX extends MySqlBuilder {
	private param: ParamKeyIX;

	constructor(builder: Builders, param: ParamKeyIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, IX, key, IDX, page} = this.param;
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
			if (v === undefined) continue;
			where += ' AND t.`' + k.name + '`=\'' + v + '\'';
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ' AND t0.id>' + start;
		}
		let sql = `SELECT ${cols} FROM ${tables}${joinID} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.id ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
}
