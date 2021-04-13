"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIX = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIX extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, IX1, ix, IDX, page, order } = this.param;
        let colsTables;
        let itemTable;
        if (IX1) {
            itemTable = 1;
            colsTables = this.buildIXIXIDX(IX, IX1, IDX);
        }
        else {
            itemTable = 0;
            colsTables = this.buildIXIDX(IX, IDX);
        }
        let { cols, tables } = colsTables;
        let where = '';
        if (ix === undefined || ix === null) {
            where = ` AND t0.ix=@user`;
        }
        else {
            if (Array.isArray(ix) === true) {
                if (ix.length > 0) {
                    where = ` AND t0.ix in (${ix.join(',')})`;
                }
            }
            else {
                where = ` AND t0.ix=${ix}`;
            }
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            where += ` AND t${itemTable}.xi>${start}`;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ` ORDER BY t${itemTable}.xi ${this.buildOrder(order)}`;
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlIX = SqlIX;
//# sourceMappingURL=sqlIX.js.map