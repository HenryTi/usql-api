import { ParamID } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlID extends MySqlBuilder {
	private param: ParamID;

	constructor(builder: Builders, param: ParamID) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IDX, id, page} = this.param;
		let {cols, tables} = this.buildIDX(IDX);
		let where:string = '';
		let limit:string = '';
		if (id !== undefined) {
			where = 't0.id' + (typeof id === 'number'? 
				'=' + id
				:
				` in (${(id.join(','))})`);
		}
		else {
			where = '1=1'
		}
		if (page !== undefined) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ` AND t0.id>${start}`;
			limit = `limit ${size}`;
		}
		let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
		return sql;
	}
}
