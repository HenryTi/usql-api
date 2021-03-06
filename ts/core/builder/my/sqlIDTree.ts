import { ParamIDTree } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDTree extends MySqlBuilder {
	private param: ParamIDTree;

	constructor(builder: Builders, param: ParamIDTree) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, parent, key, level, page} = this.param;
		if (!level) level = 1;
		let keyField = ID.schema.keys[1];
		let {name:keyName, type} = keyField;
		let table = `\`tv_${ID.name}\``;
		let eq:string, as:string;
		if (type === 'textid') {
			eq = `tv_$textid('${key}')`;
			as = `tv_$idtext(a.\`${keyName}\`) as \`${keyName}\``;
		}
		else {
			eq = `'${key}'`;
			as = `a.\`${keyName}\` as \`${keyName}\``;
		}
		function select(n:number):string {
			let s = `select t${n}.id from ${table} as t1`;
			for (let i=2; i<=n; i++) s += ` join ${table} as t${i} on t${i-1}.id=t${i}.parent`;
			s += ` where t1.parent=${parent}`;
			if (key) s += ` and t1.${keyName}=${eq}`;
			return s;
		}


		let sql = `select a.id, a.parent, ${as} from ${table} as a join (`;
		sql += select(1);
		for (let i=2; i<=level; i++) sql += ` union (${select(i)})`;
		sql += ') as t on a.id=t.id where 1=1';
		if (page !== undefined) {
			let {start, size} = page;
			if (!start) start = 0;
			sql += ` AND a.id>${start} limit ${size}`;
		}
		return sql;
	}
}
