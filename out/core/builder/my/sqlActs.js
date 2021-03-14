"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlActs = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlActs extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { $ } = this.param;
        let arr = $;
        let sql = 'set @ret=\'\';\n';
        for (let i = 0; i < arr.length; i++) {
            let p = this.param[arr[i]];
            switch (p.schema.type) {
                case 'id':
                    sql += this.buildSaveID(p);
                    break;
                case 'idx':
                    sql += this.buildSaveIDX(p);
                    break;
                case 'ix':
                    sql += this.buildSaveIX(p);
                    break;
            }
        }
        return sql + 'select @ret as ret;\n';
    }
}
exports.SqlActs = SqlActs;
//# sourceMappingURL=sqlActs.js.map