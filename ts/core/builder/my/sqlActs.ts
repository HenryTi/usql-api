import { ParamActs } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlActs extends MySqlBuilder {
	private param: ParamActs;

	constructor(builder: Builders, param: ParamActs) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {$} = this.param;
		let arr = $ as unknown as string[];
		let sql = 'set @ret=\'\';\n';
		for (let i=0; i<arr.length; i++) {
			let p = this.param[arr[i]];
			switch (p.schema.type) {
				case 'id': sql += this.buildSaveIDWithRet(p); break;
				case 'idx': sql += this.buildSaveIDX(p); break;
				case 'ix': sql += this.buildSaveIX(p); break;
			}
		}
		return sql + 'select @ret as ret;\n';
	}
}
