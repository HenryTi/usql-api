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
        let { IX, ID, IXs, values } = this.param;
        let sql = 'set @ret=\'\';\n';
        for (let value of values) {
            let { ix, id } = value;
            if (!id)
                continue;
            let ixValue = { ix: ix !== null && ix !== void 0 ? ix : { value: '@user' }, id: undefined };
            if (typeof id === 'object') {
                sql += this.buildSaveIDWithoutRet(ID, id);
                ixValue.id = { value: '@id' };
            }
            else {
                ixValue.id = id;
            }
            sql += this.buildSaveIX(IX, ixValue);
            sql += this.buildIXs(IXs, ixValue);
        }
        return sql + 'select @ret as ret;\n';
    }
    buildIXs(IXs, ixValue) {
        if (!IXs)
            return '';
        let sql = '';
        for (let IXi of IXs) {
            let { IX, ix } = IXi;
            ixValue.ix = ix !== null && ix !== void 0 ? ix : { value: '@user' };
            sql += this.buildSaveIX(IX, ixValue);
        }
        return sql;
    }
}
exports.SqlActIX = SqlActIX;
//# sourceMappingURL=sqlActIX.js.map