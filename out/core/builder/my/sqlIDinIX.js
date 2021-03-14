"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDinIX = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDinIX extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ID, id, page } = this.param;
        let { cols, tables } = this.buildIDX([ID]);
        let where = '';
        let limit = '';
        where = '1=1';
        if (page !== undefined) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ` AND t0.id>${start}`;
            limit = `limit ${size}`;
        }
        cols += `,case when exists(select id2 from \`tv_${IX.name}\` where id=${id !== null && id !== void 0 ? id : '@user'} and id2=t0.id) then 1 else 0 end as $in`;
        let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
        return sql;
    }
}
exports.SqlIDinIX = SqlIDinIX;
//# sourceMappingURL=sqlIDinIX.js.map