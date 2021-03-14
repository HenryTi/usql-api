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
		let {id, master, detail, detail2, detail3} = this.param;
		let sql = this.buildDetailSelect(master, '`id`='+id);
		let whereMaster = '`master`=' + id;
		sql += this.buildDetailSelect(detail, whereMaster);
		sql += this.buildDetailSelect(detail2, whereMaster);
		sql += this.buildDetailSelect(detail3, whereMaster);
		return sql;
	}
}
