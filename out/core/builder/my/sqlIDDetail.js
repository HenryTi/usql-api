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
        let { id, master, detail, detail2, detail3 } = this.param;
        let sql = this.buildDetailSelect(master, '`id`=' + id);
        let whereMaster = '`master`=' + id;
        sql += this.buildDetailSelect(detail, whereMaster);
        sql += this.buildDetailSelect(detail2, whereMaster);
        sql += this.buildDetailSelect(detail3, whereMaster);
        return sql;
    }
}
exports.SqlIDDetail = SqlIDDetail;
//# sourceMappingURL=sqlIDDetail.js.map