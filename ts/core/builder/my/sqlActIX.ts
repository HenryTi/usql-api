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
			let ixValue = {ix: ix ?? {value:'@user'}, id: undefined};
			if (typeof id === 'object') {
				sql += this.buildSaveIDWithoutRet(ID, id);
				ixValue.id = {value:'@id'};
			}
			else {
				ixValue.id = id;
			}
			sql += this.buildSaveIX(IX, ixValue);
		}
		return sql + 'select @ret as ret;\n';
	}
}
