import { ParamKeyIXSum } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlKeyIXSum extends MySqlBuilder {
	private param: ParamKeyIXSum;

	constructor(builder: Builders, param: ParamKeyIXSum) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, IX, key, IDX, page} = this.param;
		let sql = this.buildSumSelect(this.param);
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
}
