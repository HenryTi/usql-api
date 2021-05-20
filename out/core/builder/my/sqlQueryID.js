"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlQueryID = exports.retTab = exports.retLn = void 0;
const mySqlBuilder_1 = require("./mySqlBuilder");
exports.retLn = "set @ret=CONCAT(@ret, '\\n');\n";
exports.retTab = "set @ret=CONCAT(@ret, @id, '\\t');\n";
class SqlQueryID extends mySqlBuilder_1.MySqlBuilder {
    constructor(builder, param) {
        super(builder);
        this.cols = '';
        this.tables = [];
        this.wheres = [];
        this.order = '';
        this.limit = '';
        this.param = param;
    }
    build() {
        //let {ID, IX, IDX, id, key, ix, page, order} = this.param;
        this.t = 0;
        this.sqlID();
        this.sqlIX();
        this.sqlIDX();
        this.sqlPage();
        this.sqlOrder();
        let sql = 'SELECT ' + this.cols;
        sql += '\n\tFROM ';
        let t0 = this.tables[0];
        sql += 'tv_' + t0.name + ' as ' + t0.alias;
        let tLen = this.tables.length;
        for (let i = 1; i < tLen; i++) {
            let t = this.tables[i];
            let { name, alias, join, fieldLeft } = t;
            sql += `\n\t\t${join} JOIN tv_${name} AS ${alias} ON `;
            if (this.hasUnit === true) {
                sql += `${t0.alias}.\`$unit\`=${alias}.\`$unit\` AND `;
            }
            sql += `${t0.alias}.${t0.fieldRight}=${alias}.${fieldLeft}`;
            // t0 = t;
        }
        if (this.wheres.length > 0) {
            sql += '\n\tWHERE ' + this.wheres.join(' AND ');
        }
        if (this.order.length > 0) {
            sql += this.order;
        }
        if (this.limit.length > 0) {
            sql += `\n\tLIMIT ${this.limit}`;
        }
        return sql + ';\n';
    }
    sqlID() {
        //ID key must be with key, ID table stay after other tabble
        let { ID, key, id } = this.param;
        if (!ID)
            return;
        let t = this.t;
        ++this.t;
        let { name, schema } = ID;
        let { keys } = schema;
        this.tables.push({
            name,
            alias: 't' + t,
            join: '',
            fieldLeft: 'id',
            fieldRight: 'id',
        });
        if (this.hasUnit === true) {
            this.wheres.push(`t${this.t}.$unit=@unit`);
        }
        if (id !== undefined) {
            let where = `t${this.t}.id`;
            if (Array.isArray(id) === true) {
                let ids = id;
                let len = ids.length;
                if (len > 0) {
                    if (len === 1)
                        where += '=' + ids[0];
                    else
                        where += ` in (${(ids.join(','))})`;
                    this.wheres.push(where);
                }
            }
            else if (typeof id === 'number') {
                where += '=' + id;
                this.wheres.push(where);
            }
        }
        if (key && keys) {
            for (let k of keys) {
                let { name, type, tuid } = k;
                let v = key[name];
                if (v === undefined) {
                    if (type === 'id' && tuid === '$user') {
                        this.wheres.push(`t${t}.\`${k.name}\`=@user`);
                    }
                    continue;
                }
                this.wheres.push(`t${t}.\`${k.name}\`='${v}'`);
            }
        }
    }
    sqlIX() {
        let { IX: IXArr, ix, key } = this.param;
        if (!IXArr)
            return;
        let IX = IXArr[0];
        let { isXi } = IX;
        let ixField = isXi === true ? 'xi' : 'ix';
        if (ix !== undefined) {
            this.wheres.push(`t${this.t}.${ixField}='${ix}'`);
        }
        else if (key === undefined) {
            this.wheres.push(`t${this.t}.${ixField}=@user`);
        }
        for (let IX of IXArr) {
            let { name, isXi } = IX;
            let t = this.t;
            ++this.t;
            this.tables.push(Object.assign({
                name,
                alias: 't' + t,
                join: '',
                fieldLeft: undefined,
                fieldRight: undefined,
            }, (isXi === true ?
                {
                    fieldLeft: 'xi',
                    fieldRight: 'ix',
                }
                :
                    {
                        fieldLeft: 'ix',
                        fieldRight: 'xi',
                    })));
        }
    }
    sqlIDX() {
        let { IDX: IDXArr, keyx, idx } = this.param;
        if (!IDXArr)
            return;
        if (IDXArr.length === 0)
            return;
        if (idx !== undefined) {
            let where = `t${this.t}.id`;
            if (Array.isArray(idx) === true) {
                let ids = idx;
                let len = ids.length;
                if (len > 0) {
                    if (len === 1)
                        where += '=' + ids[0];
                    else
                        where += ` in (${(ids.join(','))})`;
                    this.wheres.push(where);
                }
            }
            else if (typeof idx === 'number') {
                where += '=' + idx;
                this.wheres.push(where);
            }
        }
        if (keyx) {
            let IDX = IDXArr[0];
            let { schema } = IDX;
            let { keys } = schema;
            for (let k of keys) {
                let { name, type, tuid } = k;
                let v = keyx[name];
                if (v === undefined) {
                    if (type === 'id' && tuid === '$user') {
                        this.wheres.push(`t${this.t}.\`${k.name}\`=@user`);
                    }
                    continue;
                }
                this.wheres.push(`t${this.t}.\`${k.name}\`='${v}'`);
            }
        }
        let idCol = `, t${this.t}.id`;
        let len = IDXArr.length;
        for (let i = 0; i < len; i++) {
            let IDX = IDXArr[i];
            let { name, schema } = IDX;
            this.tables.push({
                name,
                alias: 't' + this.t,
                join: 'left',
                fieldLeft: 'id',
                fieldRight: 'id',
            });
            this.buildCols(schema);
            this.t++;
        }
        this.cols += idCol;
    }
    sqlPage() {
        let { page } = this.param;
        if (!page)
            return;
        let { start, size } = page;
        if (!start)
            start = 0;
        //let tbl = this.tables[this.tables.length-1];
        //let {alias, fieldRight} = tbl;
        let tbl = this.tables[0];
        let { alias, fieldLeft } = tbl;
        this.wheres.push(`${alias}.${fieldLeft}>${start}`);
        this.limit = `${size}`;
    }
    sqlOrder() {
        let { order } = this.param;
        if (!order)
            return;
        let ord;
        switch (order) {
            default:
            case 'asc':
                ord = 'asc';
                break;
            case 'desc':
                ord = 'desc';
                break;
        }
        //let tbl = this.tables[this.tables.length-1];
        let tbl = this.tables[0];
        let { alias, fieldLeft } = tbl;
        this.order = `\n\tORDER BY ${alias}.${fieldLeft} ${ord}`;
    }
    buildCols(schema) {
        let { fields, type, exFields } = schema;
        let $fieldBuilt = false;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id')
                continue;
            if (fn === '$create') {
                if (this.$fieldBuilt === true)
                    continue;
                this.cols += `, unix_timestamp(t${this.t}.$create) as $create`;
                $fieldBuilt = true;
                continue;
            }
            if (fn === '$update') {
                if (this.$fieldBuilt === true)
                    continue;
                this.cols += `, unix_timestamp(t${this.t}.$update) as $update`;
                $fieldBuilt = true;
                continue;
            }
            if (fn === '$owner') {
                if (this.$fieldBuilt === true)
                    continue;
                this.cols += `, t${this.t}.$owner`;
                $fieldBuilt = true;
                continue;
            }
            let fv = `t${this.t}.\`${fn}\``;
            if (this.cols.length > 0)
                this.cols += ',';
            this.cols += ft === 'textid' ? `tv_$idtext(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
        }
        this.$fieldBuilt = $fieldBuilt;
        if (type === 'idx' && this.doneTimeField === false && exFields) {
            let hasLog = false;
            for (let exField of exFields) {
                let { log } = exField;
                if (log === true) {
                    hasLog = true;
                    break;
                }
            }
            if (hasLog === true) {
                this.cols += `,t${this.t}.\`$time\` as \`$time\``;
                this.cols += `,tv_$idtext(t${this.t}.\`$field\`) as \`$field\``;
                this.cols += `,t${this.t}.\`$value\` as \`$value\``;
                this.doneTimeField = true;
            }
        }
    }
}
exports.SqlQueryID = SqlQueryID;
//# sourceMappingURL=sqlQueryID.js.map