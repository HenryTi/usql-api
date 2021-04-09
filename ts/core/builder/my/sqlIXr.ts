import { ParamIX } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIXr extends MySqlBuilder {
	private param: ParamIX;

	constructor(builder: Builders, param: ParamIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, ix, IDX, page} = this.param;
		let {cols, tables} = this.buildIXrIDX(IX, IDX);
		let where = '';
		if (ix) {
			if (Array.isArray(ix) === true) {
				if ((ix as []).length > 0) {
					where = ' AND t0.xi in (' + (ix as []).join(',') + ')'
				}
			}
			else {
				where = ' AND t0.xi=' + ix;
			}
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ' AND t0.ix>' + start;
		}
		let sql = `SELECT distinct ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.ix ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
}
