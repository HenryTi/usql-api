"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlID = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IDX, id, page } = this.param;
        let { cols, tables } = this.buildIDX(IDX);
        let where = '';
        let limit = '';
        if (id !== undefined) {
            where = 't0.id' + (typeof id === 'number' ?
                '=' + id
                :
                    ` in (${(id.join(','))})`);
        }
        else {
            where = '1=1';
        }
        if (page !== undefined) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ` AND t0.id>${start}`;
            limit = `limit ${size}`;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE ${where} ${limit}`;
        return sql;
    }
}
exports.SqlID = SqlID;
//# sourceMappingURL=sqlID.js.map