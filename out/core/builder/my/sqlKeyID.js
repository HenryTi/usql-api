"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlKeyID = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
class SqlKeyID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.param = param;
    }
    build() {
        let { ID, key, IDX, page } = this.param;
        let arr = [ID];
        if (IDX)
            arr.push(...IDX);
        let { cols, tables } = this.buildIDX(arr);
        let { schema } = ID;
        let { keys } = schema;
        let where = '';
        if (this.hasUnit === true) {
            where += 't0.$unit=@unit';
        }
        for (let k of keys) {
            let v = key[k.name];
            if (v === undefined)
                break;
            where += ' AND t0.`' + k.name + '`=\'' + v + '\'';
        }
        if (page) {
            let { start, size } = page;
            if (!start)
                start = 0;
            where += ' AND t0.id>' + start;
        }
        let sql = `SELECT ${cols} FROM ${tables} WHERE 1=1${where}`;
        sql += ' ORDER BY t0.id ASC';
        if (page)
            sql += ' LIMIT ' + page.size;
        sql += ';\n';
        return sql;
    }
}
exports.SqlKeyID = SqlKeyID;
//# sourceMappingURL=sqlKeyID.js.map