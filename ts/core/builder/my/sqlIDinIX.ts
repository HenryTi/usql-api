import { ParamIDinIX } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDinIX extends MySqlBuilder {
	private param: ParamIDinIX;

	constructor(builder: Builders, param: ParamIDinIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, ID, id, page} = this.param;
		let {cols, tables} = this.buildIDX([ID]);
		let where:string = '';
		let limit:string = '';
		where = '1=1';
		if (page !== undefined) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ` AND t0.id>${start}`;
			limit = `limit ${size}`;
		}
		cols += `,case when exists(select id2 from \`tv_${IX.name}\` where id=${id??'@user'} and id2=t0.id) then 1 else 0 end as $in`;
		
		let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
		return sql;
	}
}
