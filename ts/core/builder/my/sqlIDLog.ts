import { ParamIDLog } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDLog extends MySqlBuilder {
	private param: ParamIDLog;

	constructor(builder: Builders, param: ParamIDLog) {
		super(builder);
		this.param = param;
	}

	build():string {
		let {IDX, field, id, log, timeZone, page, far, near} = this.param;
		field = field.toLowerCase();
		let {start, size} = page;
		if (!start) start = Number.MAX_SAFE_INTEGER;
		let {name, schema} = IDX;
		let {exFields} = schema;
		let exField = exFields?.find(v => v.field === field);
		let span = '';
		if (far) span += ` AND a.t>=${far}`;
		if (near) span += ` AND a.t<${near}`;
		let table = '`tv_' + name + '$' + field + '`';
		let cols = 'a.t, a.v, a.u, a.a';
		if (exField) {
			let {log, track, memo, sum} = exField;
			if (log !== true) {
				return `select 'IDX ${name} ${field}' is not loged`;
			}
			if (sum === true) cols += ',a.s';
			if (track === true) cols += ',a.k';
			if (memo === true) cols += ',a.m';
		}
		let group:string;
		let time = `from_unixtime(a.t/1000+${timeZone}*3600)`;
		switch (log) {
			default:
				return `select 'IDX ${name} ${field}' log ${log} unknown`;
			case 'each':
				return `SELECT ${cols} FROM ${table} as a WHERE a.id=${id} AND a.t<${start} ${span} ORDER BY a.t DESC LIMIT ${size}`;
			case 'day': group = `DATE_FORMAT(${time}, '%Y-%m-%d')`; ; break;
			case 'week': group = `YEARWEEK(${time}, 2)`; break;
			case 'month': group = `DATE_FORMAT(${time}, '%Y-%m-01')`; break;
			case 'year': group = `DATE_FORMAT(${time}, '%Y-01-01')`; break;
		}
		let sql = `select ${group} as t, sum(a.v) as v from ${table} as a where a.t<${start} and a.id=${id} ${span} group by ${group} order by t limit ${size}`;
		return sql;
	}
}
