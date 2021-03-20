import { ParamActIX } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlActIX extends MySqlBuilder {
	private param: ParamActIX;

	constructor(builder: Builders, param: ParamActIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, ID, values} = this.param;
		let sql = 'set @ret=\'\';\n';
		for (let value of values) {
			let {ix, id} = value;
			if (!id) continue;
			if (typeof id === 'object') {
				sql += this.buildSaveID(ID, id);
			}
			else {
				sql += `set @id=${id}\n`;
			}
			sql += this.buildSaveIX(IX, {ix: ix ?? {value:'@user'}, id: {value:'@id'}});
		}
		return sql + 'select @ret as ret;\n';
	}
}