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
			let {id, id2} = value;
			if (!id2) continue;
			if (typeof id2 === 'object') {
				sql += this.buildSaveID(ID, id2);
			}
			else {
				sql += `set @id=${id2}\n`;
			}
			sql += this.buildSaveIX(IX, {id: id ?? {value:'@user'}, id2: {value:'@id'}});
		}
		return sql + 'select @ret as ret;\n';
	}
}
