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
        let { IX, ix, IDX, page } = this.param;
        let arr = [IX];
        if (IDX)
            arr.push(...IDX);
        let { cols, tables } = this.buildIDX(arr);
        let where = '';
        if (ix) {
            if (Array.isArray(ix) === true) {
                if (ix.length > 0) {
                    where = ' AND t0.ix in (' + ix.join(',') + ')';
                }
            }
            else {
                where = ' AND t0.ix=' + ix;
            }
        }
        else {
            where = ' AND t0.id=@user';
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            where += ' AND t0.id>' + start;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlIX = SqlIX;
//# sourceMappingURL=sqlIX.js.map