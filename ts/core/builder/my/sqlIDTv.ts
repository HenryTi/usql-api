import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDTv extends MySqlBuilder {
	private ids: number[];

	constructor(builder: Builders, ids: number[]) {
		super(builder);
		this.ids = ids;
	}

	build():string {
		let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM tv_$id as a 
		JOIN tv_$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.ids.join(',')});`;
		return sql;
	}
}
