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
		let {main, detail, detail2, detail3} = this.param;
		let {values} = main;
		let mainOverride = {
			id: `(@main:=@id:=tv_$id(${main.schema.typeId}))`,
			no: `tv_$no(@unit, '${main.name}')`,
		}
		let sql = 'SET @ret=\'\';\n';
		sql += this.buildInsert(main, mainOverride);
		let detailOverride = {
			id: `(@id:=tv_$id(${detail.schema.typeId}))`,
			master: '@main',
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
