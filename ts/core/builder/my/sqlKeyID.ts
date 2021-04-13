import { ParamKeyID } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlKeyID extends MySqlBuilder {
	private param: ParamKeyID;

	constructor(builder: Builders, param: ParamKeyID) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {ID, IX, key, ix, IDX, page} = this.param;
		let arr = [];
		let tID: number, tIX: number;
		let where = '';
		if (this.hasUnit === true) {
			where += 't0.$unit=@unit'
		}
		if (ID) {
			tID = arr.length;
			arr.push(ID);
		}
		if (IX) {
			tIX = arr.length;
			arr.push(...IX);
			if (ix) {
				where += ` AND t${tIX}.ix=${ix}`;
			}
			else {
				where += ` AND t${tIX}.ix=@user`;
			}
		}
		if (IDX) {
			arr.push(...IDX);
		}

		let {cols, tables} = this.buildIDX(arr);
		let {schema} = ID;
		let {keys} = schema;
		for (let k of keys) {
			let v = key[k.name];
			if (v === undefined) continue;
			where += ` AND t${tID}.\`${k.name}\`='${v}'`;
		}
		if (page) {
			let {start, size} = page;
			if (!start) start = 0;
			where += ` AND t${tID}.id>${start}`;
		}

		let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
		sql += ` ORDER BY t${tID}.id ASC`;
		if (page) sql += ' LIMIT ' + page.size;
		sql += ';\n';
		return sql;
	}
}
