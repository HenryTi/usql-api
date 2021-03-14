"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActIX = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActIX extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { IX, ID, values } = this.param;
        let sql = 'set @ret=\'\';\n';
        for (let value of values) {
            let { id, id2 } = value;
            if (!id2)
                continue;
            if (typeof id2 === 'object') {
                sql += this.buildSaveID(ID, id2);
            }
            else {
                sql += `set @id=${id2}\n`;
            }
            sql += this.buildSaveIX(IX, { id: id !== null && id !== void 0 ? id : { value: '@user' }, id2: { value: '@id' } });
        }
        return sql + 'select @ret as ret;\n';
    }
}
exports.SqlActIX = SqlActIX;
//# sourceMappingURL=sqlActIX.js.map