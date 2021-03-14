"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDxID = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDxID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { ID, IX, ID2, page } = this.param;
        page = page !== null && page !== void 0 ? page : { start: 0, size: 100 };
        let { cols, tables } = this.buildIDX([ID]);
        let where = '';
        let limit = '';
        where = '1=1';
        let { start, size } = page;
        if (!start)
            start = 0;
        where += ` AND t0.id>${start}`;
        limit = `limit ${size}`;
        let { cols: cols2, tables: tables2 } = this.buildIDX([ID2]);
        let sql = '';
        sql += `DROP TEMPORARY TABLE IF EXISTS ids;`;
        sql += '\nCREATE TEMPORARY TABLE ids (id BIGINT, primary key (id));';
        sql += `\nINSERT INTO ids (id) SELECT t0.id FROM ${tables} WHERE ${where} ${limit};`;
        sql += `\nSELECT ${cols} FROM ${tables} JOIN ids as z ON t0.id=z.id;`;
        sql += `\nSELECT x.id as \`$xid\`, ${cols2} FROM ${tables2} JOIN \`tv_${IX.name}\` as x ON t0.id=x.id2 JOIN ids as z ON x.id=z.id;`;
        return sql;
    }
}
exports.SqlIDxID = SqlIDxID;
//# sourceMappingURL=sqlIDxID.js.map