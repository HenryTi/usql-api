import { ParamIDNO } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDNO extends MySqlBuilder {
	private param: ParamIDNO;

	constructor(builder: Builders, param: ParamIDNO) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID} = this.param;
		let sql = `SELECT tv_$no(@unit, '${ID.name}') as no;`;
		return sql;
	}
}
