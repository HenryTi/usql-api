"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyIDSum = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlKeyIDSum extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { ID, key, page } = this.param;
        let sql = this.buildSumSelect(this.param);
        let { schema } = ID;
        let { keys } = schema;
        sql += ` RIGHT JOIN \`tv_${ID.name}\` as t0 ON t0.id=t.id WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND t0.$unit=@unit';
        }
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined)
                break;
            sql += ' AND t0.`' + k.name + '`=\'' + v + '\'';
        }
        if (page) {
            let { start } = page;
            if (!start)
                start = 0;
            sql += ' AND t0.id>' + start;
        }
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlKeyIDSum = SqlKeyIDSum;
//# sourceMappingURL=sqlKeyIDSum.js.map