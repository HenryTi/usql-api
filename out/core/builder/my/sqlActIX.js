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
            let { ix, id } = value;
            if (!id)
                continue;
            if (typeof id === 'object') {
                sql += this.buildSaveID(ID, id);
            }
            else {
                sql += `set @id=${id}\n`;
            }
            sql += this.buildSaveIX(IX, { ix: ix !== null && ix !== void 0 ? ix : { value: '@user' }, id: { value: '@id' } });
        }
        return sql + 'select @ret as ret;\n';
    }
}
exports.SqlActIX = SqlActIX;
//# sourceMappingURL=sqlActIX.js.map