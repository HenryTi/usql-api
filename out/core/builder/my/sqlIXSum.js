"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIXSum = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIXSum extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, id, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        sql += ` RIGHT JOIN \`tv_${IX.name}\` as t0 ON t0.id=t.id WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        sql = ' AND t0.id' + (Array.isArray(id) ?
            ' in (' + id.join(',') + ')'
            :
                '=' + id);
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            sql += ' AND t0.id2>' + start;
        }
        sql += ' ORDER BY t0.id2 ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlIXSum = SqlIXSum;
//# sourceMappingURL=sqlIXSum.js.map