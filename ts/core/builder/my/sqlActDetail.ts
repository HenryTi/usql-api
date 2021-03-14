import { ParamActDetail } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlActDetail extends MySqlBuilder {
	private param: ParamActDetail;

	constructor(builder: Builders, param: ParamActDetail) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {master, detail, detail2, detail3} = this.param;
		let {values} = master;
		let masterOverride = {
			id: `(@master:=@id:=tv_$id(${master.schema.typeId}))`,
			no: `tv_$no(@unit, '${master.name}')`,
		}
		let sql = 'SET @ret=\'\';\n';
		sql += this.buildInsert(master, masterOverride);
		let detailOverride = {
			id: `(@id:=tv_$id(${detail.schema.typeId}))`,
			master: '@master',
			row: '(@row:=@row+1)',
		}
		sql += this.buildInsert(detail, detailOverride);
		if (detail2) {
			let detailOverride2 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail2.schema.typeId}))`,
			}
			sql += this.buildInsert(detail2, detailOverride2);
		}
		if (detail3) {
			let detailOverride3 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail3.schema.typeId}))`,
			}
			sql += this.buildInsert(detail3, detailOverride3);
		}
		sql += 'SELECT @ret as ret;\n';
		return sql;
	}
}
