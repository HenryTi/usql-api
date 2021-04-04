import { ParamActIX, TableSchema } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlActIX extends MySqlBuilder {
	private param: ParamActIX;

	constructor(builder: Builders, param: ParamActIX) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IX, ID, IXs, values} = this.param;
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
			sql += this.buildIXs(IXs, ixValue);
		}
		return sql + 'select @ret as ret;\n';
	}

	private buildIXs(IXs:{IX:TableSchema; ix:number}[], ixValue: {ix:any, id:any}): string {
		if (!IXs) return '';
		let sql = '';
		for (let IXi of IXs) {
			let {IX, ix} = IXi;
			ixValue.ix = ix ?? {value:'@user'};
			sql += this.buildSaveIX(IX, ixValue);
		}
		return sql;
	}
}
