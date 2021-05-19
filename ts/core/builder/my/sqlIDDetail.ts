import { ParamIDDetailGet } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDDetail extends MySqlBuilder {
	private param: ParamIDDetailGet;

	constructor(builder: Builders, param: ParamIDDetailGet) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {id, main, detail, detail2, detail3} = this.param;
		let sql = this.buildDetailSelect(main, '`id`='+id);
		let whereMain = '`parent`=' + id;
		sql += this.buildDetailSelect(detail, whereMain);
		sql += this.buildDetailSelect(detail2, whereMain);
		sql += this.buildDetailSelect(detail3, whereMain);
		return sql;
	}
}
