"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXr = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIXr extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, id, IDX, page } = this.param;
        let arr = [IX];
        if (IDX)
            arr.push(...IDX);
        let { cols, tables } = this.buildIDX(arr, true);
        let where = '';
        if (id) {
            if (Array.isArray(id) === true) {
                if (id.length > 0) {
                    where = ' AND t0.id2 in (' + id.join(',') + ')';
                }
            }
            else {
                where = ' AND t0.id2=' + id;
            }
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            where += ' AND t0.id>' + start;
        }
        let sql = `SELECT distinct ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlIXr = SqlIXr;
//# sourceMappingURL=sqlIXr.js.map