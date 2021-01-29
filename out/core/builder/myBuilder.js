"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyBuilder = void 0;
const builder_1 = require("./builder");
class MyBuilder extends builder_1.Builder {
    IDActs(param) {
        let { $ } = param;
        let arr = $;
        let sql = 'SET @ret=\'\';\n';
        for (let i = 0; i < arr.length; i++) {
            let p = param[arr[i]];
            switch (p.schema.type) {
                case 'id':
                    sql += this.buildSaveID(p);
                    break;
                case 'idx':
                    sql += this.buildSaveIDX(p);
                    break;
                case 'id2':
                    sql += this.buildSaveID2(p);
                    break;
            }
        }
        return sql + 'select @ret as ret;\n';
    }
    IDDetail(param) {
        let { master, detail, detail2, detail3 } = param;
        let masterOverride = {
            id: '(@master:=@id:=tv_$id())',
            no: `tv_$no(@unit, '${master.name}')`,
        };
        let sql = 'SET @ret=\'\';\n';
        sql += this.buildInsert(master, masterOverride);
        let detailOverride = {
            id: '(@id:=tv_$id())',
            master: '@master',
            row: '(@row:=@row+1)',
        };
        sql += this.buildInsert(detail, detailOverride);
        sql += this.buildInsert(detail2, detailOverride);
        sql += this.buildInsert(detail3, detailOverride);
        sql += 'SELECT @ret as ret;\n';
        return sql;
    }
    IDDetailGet(param) {
        let { id, master, detail, detail2, detail3 } = param;
        let sql = this.buildDetailSelect(master, '`id`=' + id);
        let whereMaster = '`master`=' + id;
        sql += this.buildDetailSelect(detail, whereMaster);
        sql += this.buildDetailSelect(detail2, whereMaster);
        sql += this.buildDetailSelect(detail3, whereMaster);
        return sql;
    }
    ID(param) {
        let { IDX, id } = param;
        let { cols, tables } = this.buildIDX(IDX);
        let where = typeof id === 'number' ?
            '=' + id
            :
                ` in (${(id.join(','))})`;
        let sql = `SELECT ${cols} FROM ${tables} WHERE t0.id${where}`;
        return sql;
    }
    KeyID(param) {
        let { ID, IDX, key, page } = param;
        let { cols, tables } = this.buildIDX(IDX);
        let where = '';
        let sql = `SELECT ${cols} FROM ${tables} WHERE t0.id${where}`;
        return sql;
    }
    ID2(param) {
        return;
    }
    KeyID2(param) {
        return;
    }
    IDLog(param) {
        return;
    }
    buildIDX(IDX) {
        let { name, schema } = IDX[0];
        let tables = `\`${this.dbName}\`.\`tv_${name}\` as t0`;
        let cols = 't0.id';
        for (let f of schema.fields) {
            let fn = f.name;
            if (fn === 'id')
                continue;
            cols += `,t0.\`${fn}\``;
        }
        let len = IDX.length;
        for (let i = 1; i < len; i++) {
            let { name, schema } = IDX[i];
            tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${i} on t0.id=t${i}.id`;
            for (let f of schema.fields) {
                let fn = f.name;
                if (fn === 'id')
                    continue;
                cols += `,t${i}.\`${fn}\``;
            }
        }
        return { cols, tables };
    }
    buildInsert(ts, override, valueItem) {
        if (!ts)
            return '';
        let { name, schema, values } = ts;
        let { fields, owner } = schema;
        if (!override)
            override = {};
        let sql = 'set @row=0;\n';
        let cols, vals;
        let first;
        if (this.hasUnit === true) {
            cols = '`$unit`';
            vals = '@unit';
            first = false;
        }
        else {
            cols = '';
            vals = '';
            first = true;
        }
        for (let f of fields) {
            let { name } = f;
            if (first === true) {
                first = false;
            }
            else {
                cols += ',';
            }
            ;
            cols += `\`${name}\``;
        }
        if (owner === true) {
            cols += ',`$owner`';
        }
        if (valueItem !== undefined) {
            values = [valueItem];
        }
        for (let value of values) {
            sql += `insert into \`tv_${name}\`\n\t(${cols})\n\tvalues\n\t`;
            first = true;
            vals = '';
            for (let f of fields) {
                let { name, type } = f;
                if (first === true) {
                    first = false;
                }
                else {
                    vals += ',';
                }
                ;
                let v = override[name];
                if (v !== undefined) {
                    vals += v;
                }
                else {
                    v = value[name];
                    vals += v === undefined ? 'null' :
                        (type === 'textid' ? `tv_$textid('${v}')` : `'${v}'`);
                }
            }
            if (owner === true) {
                vals += ',@user';
            }
            sql += `(${vals});\n`;
            sql += `SET @ret=CONCAT(@ret, @id, '\\t');\n`;
        }
        sql += `SET @ret=CONCAT(@ret, '\\n');\n`;
        return sql;
    }
    buildDetailSelect(ts, whereId) {
        if (ts === undefined)
            return '';
        let sql = 'SELECT ';
        let first = true;
        for (let f of ts.schema.fields) {
            if (first === true) {
                first = false;
            }
            else {
                sql += ',';
            }
            sql += `\`${f.name}\``;
        }
        sql += ' FROM `tv_' + ts.name + '` WHERE 1=1';
        if (this.hasUnit === true) {
            sql += ' AND `$unit`=@unit';
        }
        sql += ' AND ' + whereId;
        return sql + ';\n';
    }
    buildSaveID(ts) {
        let sql = '';
        let { values, name, schema } = ts;
        let { keys, fields } = schema;
        for (let value of values) {
            let { id } = value;
            if (id) {
                if (id < 0) {
                    sql += this.buildDelete(ts, id);
                }
                else {
                    sql += this.buildUpdate(ts, value);
                }
            }
            else {
                sql += `SET @id:=\`tv_${name}$id\`(@unit,@user,1`;
                let updateOverride = { id: '@id' };
                for (let k of keys) {
                    let { name, type } = k;
                    sql += ',';
                    if (type === 'textid')
                        sql += `tv_$textid('${value[name]}')`;
                    else
                        sql += `'${value[name]}'`;
                    updateOverride[name] = null;
                }
                sql += ');\n';
                if (fields.length > keys.length + 1) {
                    sql += this.buildUpdate(ts, value, updateOverride);
                }
                sql += `SET @ret=concat(@ret, @id, '\\t');\n`;
            }
        }
        sql += `SET @ret=concat(@ret, '\\n');\n`;
        return sql;
    }
    buildSaveIDX(ts) {
        let sql = '';
        let { values } = ts;
        for (let value of values) {
            let { id } = value;
            if (id < 0) {
                sql += this.buildDelete(ts, id);
            }
            else {
                sql += this.buildUpsert(ts, value);
            }
        }
        return sql;
    }
    buildSaveID2(ts) {
        let sql = '';
        let { values } = ts;
        for (let value of values) {
            let { id, id2 } = value;
            if (id < 0) {
                sql += this.buildDelete(ts, id, id2);
            }
            else {
                sql += this.buildUpsert(ts, value);
            }
        }
        return sql;
    }
    buildUpsert(ts, value) {
        let { schema } = ts;
        let { fields } = schema;
        let cols = '', vals = '', dup = '';
        let first = true;
        for (let f of fields) {
            let { name, type } = f;
            if (first === true) {
                first = false;
            }
            else {
                cols += ',';
                vals += ',';
                dup += ',';
            }
            cols += '\`' + name + '\`';
            let v = value[name];
            if (v === undefined) {
                v = 'null';
            }
            else {
                v = (type === 'textid' ? `tv_$textid('${v}')` : `'${v}'`);
            }
            vals += v;
            switch (name) {
                default:
                    dup += '`' + name + '`=VALUE(`' + name + '`)';
                    break;
                case 'id':
                case 'id2': continue;
            }
        }
        let sql = `insert into (${cols})\nvalues (${vals})\non duplicate key set ${dup};`;
        return sql;
    }
    buildUpdate(ts, value, override = {}) {
        let { name, schema } = ts;
        let { fields } = schema;
        let sql = 'update `tv_' + name + '` set ';
        let where = ' where 1=1';
        if (this.hasUnit === true) {
            where += ' and `$unit`=@unit';
        }
        let first = true;
        for (let f of fields) {
            let { name, type } = f;
            let ov = override[name];
            if (ov === null)
                continue;
            let v = value[name];
            switch (name) {
                default:
                    if (first === true) {
                        first = false;
                    }
                    else {
                        sql += ',';
                    }
                    sql += '\`' + name + '\`=';
                    if (ov !== undefined)
                        v = ov;
                    else if (v === undefined) {
                        v = 'null';
                    }
                    else {
                        v = (type === 'textid' ? `tv_$textid('${v}')` : `'${v}'`);
                    }
                    sql += v;
                    break;
                case 'id':
                    where += ' and id=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
                case 'id2':
                    where += ' and id2=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
            }
        }
        return sql + where + ';\n';
    }
    buildDelete(ts, id, id2) {
        let { name } = ts;
        let sql = 'delete from `tv_' + name + '` where id=-' + id;
        if (id2) {
            sql += 'id2=-' + id2;
        }
        return sql;
    }
}
exports.MyBuilder = MyBuilder;
//# sourceMappingURL=myBuilder.js.map