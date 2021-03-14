"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlIDNO = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlIDNO extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { ID } = this.param;
        let sql = `SELECT tv_$no(@unit, '${ID.name}') as no;`;
        return sql;
    }
}
exports.SqlIDNO = SqlIDNO;
//# sourceMappingURL=sqlIDNO.js.map