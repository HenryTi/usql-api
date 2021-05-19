"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDDetail = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDDetail extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { id, main, detail, detail2, detail3 } = this.param;
        let sql = this.buildDetailSelect(main, '`id`=' + id);
        let whereMain = '`parent`=' + id;
        sql += this.buildDetailSelect(detail, whereMain);
        sql += this.buildDetailSelect(detail2, whereMain);
        sql += this.buildDetailSelect(detail3, whereMain);
        return sql;
    }
}
exports.SqlIDDetail = SqlIDDetail;
//# sourceMappingURL=sqlIDDetail.js.map