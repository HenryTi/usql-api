import { ParamActIXSort } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlActIXSort extends MySqlBuilder {
	private param: ParamActIXSort;

	constructor(builder: Builders, param: ParamActIXSort) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, ix, id, after} = this.param;
		let {name, schema} = IX;
		let {hasSort} = schema as any;
		if (hasSort === true) {
			let sql = `set @ret=\`${this.dbName}\`.tv_${name}$sort(${ix},${id},${after});\n`;
			return sql + 'select @ret as ret;\n';
		}
		else {
			return 'select 0 as ret;\n';
		}
	}
}
