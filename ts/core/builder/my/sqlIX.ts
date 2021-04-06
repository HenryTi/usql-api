import { ParamIX } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIX extends MySqlBuilder {
	private param: ParamIX;

	constructor(builder: Builders, param: ParamIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, IX1, ix, IDX, page} = this.param;
		let {cols, tables} = IX1? this.buildIXIXIDX(IX, IX1, IDX) : this.buildIXIDX(IX, IDX);
		let where = '';
		if (ix) {
			if (Array.isArray(ix) === true) {
				if ((ix as []).length > 0) {
					where = ' AND t0.ix in (' + (ix as []).join(',') + ')'
				}
			}
			else {
				where = ' AND t0.ix=' + ix;
			}
		}
		else {
			where = ` AND t0.ix=@user`;
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ' AND t0.xi>' + start;
		}
		let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ' ORDER BY t0.xi ASC';
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
}
