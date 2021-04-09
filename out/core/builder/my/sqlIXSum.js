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
        let { IX, ix, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        sql += ` RIGHT JOIN \`tv_${IX.name}\` as t0 ON t0.xi=t.id WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        sql = ' AND t0.ix' + (Array.isArray(ix) ?
            ' in (' + ix.join(',') + ')'
            :
                '=' + ix);
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            sql += ' AND t0.xi>' + start;
        }
        sql += ' ORDER BY t0.xi ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlIXSum = SqlIXSum;
//# sourceMappingURL=sqlIXSum.js.map