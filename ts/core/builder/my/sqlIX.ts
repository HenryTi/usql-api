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
		let {IX, id, IDX, page} = this.param;
		let arr = [IX];
		if (IDX) arr.push(...IDX);
		let {cols, tables} = this.buildIDX(arr);
		let where = '';
		if (id) {
			if (Array.isArray(id) === true) {
				if ((id as []).length > 0) {
					where = ' AND t0.id in (' + (id as []).join(',') + ')'
				}
			}
			else {
				where = ' AND t0.id=' + id;
			}
		}
		else {
			where = ' AND t0.id=@user';
		}
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
}
