"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDSum = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDSum extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { id } = this.param;
        let sql = this.buildSumSelect(this.param);
        if (id !== undefined) {
            sql += ' where t.id';
            if (Array.isArray(id) === true) {
                sql += ' in (' + id.join() + ')';
            }
            else {
                sql += `=${id}`;
            }
        }
        return sql;
    }
}
exports.SqlIDSum = SqlIDSum;
//# sourceMappingURL=sqlIDSum.js.map