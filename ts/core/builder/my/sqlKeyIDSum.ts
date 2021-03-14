import { ParamKeyIDSum } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlKeyIDSum extends MySqlBuilder {
	private param: ParamKeyIDSum;

	constructor(builder: Builders, param: ParamKeyIDSum) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, key, page} = this.param;
		let sql = this.buildSumSelect(this.param);
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
}
