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
		let {IX, IX1, ix, IDX, page, order} = this.param;
		let colsTables: {cols: string; tables: string;};
		let itemTable: number;
		if (IX1) {
			itemTable = 1;
			colsTables = this.buildIXIXIDX(IX, IX1, IDX);
		}
		else {
			itemTable = 0;
			colsTables = this.buildIXIDX(IX, IDX);
		}
		let {cols, tables} = colsTables;
		let where = '';
		if (ix === undefined || ix === null) {
			where = ` AND t0.ix=@user`;
		}
		else {
			if (Array.isArray(ix) === true) {
				if ((ix as []).length > 0) {
					where = ` AND t0.ix in (${(ix as []).join(',')})`
				}
			}
			else {
				where = ` AND t0.ix=${ix}`;
			}
		}
		if (page) {
			let {start} = page;
			if (!start) start = 0;
			where += ` AND t${itemTable}.xi>${start}`;
		}
		let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ` ORDER BY t${itemTable}.xi ${this.buildOrder(order)}`;
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
}
