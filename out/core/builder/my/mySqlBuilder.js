"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlBuilder = exports.retTab = exports.retLn = void 0;
const tablesBuilder_1 = require("./tablesBuilder");
exports.retLn = `set @ret=CONCAT(@ret, '\\n');\n`;
exports.retTab = `set @ret=CONCAT(@ret, @id, '\\t');\n`;
class MySqlBuilder {
    constructor(builder) {
        let { dbName, hasUnit } = builder;
        this.dbName = dbName;
        this.hasUnit = hasUnit;
    }
    buildSumSelect(param) {
        let { IDX, far, near, field } = param;
        let { name, schema } = IDX;
        if (!far)
            far = 0;
        if (!near)
            near = Number.MAX_SAFE_INTEGER;
        let sql = 'select t.id';
        for (let f of field) {
            let { exFields } = schema;
            let exField = exFields === null || exFields === void 0 ? void 0 : exFields.find(v => v.field === f);
            if (exField === undefined) {
                return `select '${f} is not logged' as error`;
            }
            f = f.toLowerCase();
            sql += `,\`tv_${name}$${f}$sum\`(t.id,${far},${near}) as ${f}`;
        }
        sql += ` from \`tv_${name}\` as t`;
        return sql;
    }
    buildIXrIDX(IX, IDX) {
        let b = new tablesBuilder_1.IXrTablesBuilder(this.dbName, IX, IDX);
        b.build();
        return b;
    }
    buildIXrIXIDX(IX, IX1, IDX) {
        let b = new tablesBuilder_1.IXrIXTablesBuilder(this.dbName, IX, IX1, IDX);
        b.build();
        return b;
    }
    buildIXIDX(IX, IDX) {
        let b = new tablesBuilder_1.IXTablesBuilder(this.dbName, IX, IDX);
        b.build();
        return b;
    }
    buildIXIXIDX(IX, IX1, IDX) {
        let b = new tablesBuilder_1.IXIXTablesBuilder(this.dbName, IX, IX1, IDX);
        b.build();
        return b;
    }
    buildIDX(IDX) {
        let b = new tablesBuilder_1.TablesBuilder(this.dbName, IDX);
        b.build();
        return b;
        /*
        let {name, schema} = IDX[0];
        let idJoin = 'id';
        let ti = `t0`;
        let tables = `\`${this.dbName}\`.\`tv_${name}\` as ${ti}`;
        let cols = '';
        function buildCols(schema:EntitySchema) {
            let {fields} = schema;
            for (let f of fields) {
                let {name:fn, type:ft} = f;
                let fv = `${ti}.\`${fn}\``;
                if (cols.length > 0) cols += ',';
                cols += ft === 'textid'? `tv_$idtext(${fv})` : fv;
                cols += ' as `' + fn + '`';
            }
        }
        buildCols(schema);
        let len = IDX.length;
        let $timeField:string;
        for (let i=1; i<len; i++) {
            let {name, schema} = IDX[i];
            tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${i} on t0.${idJoin}=t${i}.id`;
            let {type} = schema;
            ti = `t${i}`;
            buildCols(schema);
            if (type === 'idx' && $timeField === undefined) {
                $timeField = `,${ti}.\`$time\` as \`$time\``;
                $timeField += `,tv_$idtext(${ti}.\`$field\`) as \`$field\``;
                $timeField += `,${ti}.\`$value\` as \`$value\``;
            }
        }
        if ($timeField !== undefined) cols += $timeField;
        return {cols, tables};
        */
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
        /*
        if (owner === true) {
            cols += ',`$owner`';
        }
        */
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
                if (name === '$owner' && owner === true) {
                    vals += '@user';
                    continue;
                }
                let v = value[name];
                let ov = override[name];
                if (v !== undefined) {
                    vals += (type === 'textid' ? `tv_$textid('${v}')` : `'${v}'`);
                }
                else if (ov !== undefined) {
                    vals += ov;
                }
                else {
                    vals += 'null';
                }
            }
            /*
            if (owner === true) {
                vals += ',@user';
            }
            */
            sql += `(${vals});\n`;
            sql += exports.retTab;
        }
        sql += exports.retLn;
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
            let { name, type } = f;
            sql += (type === 'textid') ?
                `tv_$idtext(\`${name}\`)`
                :
                    `\`${name}\``;
        }
        sql += ' FROM `tv_' + ts.name + '` WHERE 1=1';
        if (this.hasUnit === true) {
            sql += ' AND `$unit`=@unit';
        }
        sql += ' AND ' + whereId;
        return sql + ';\n';
    }
    buildSaveID(ts, idValue) {
        let sql = '';
        let { values, name, schema } = ts;
        if (idValue !== undefined) {
            values = [idValue];
        }
        let { keys, fields } = schema;
        for (let value of values) {
            let { id } = value;
            if (id) {
                if (id < 0) {
                    sql += this.buildIDDelete(ts, -id);
                }
                else {
                    sql += this.buildUpdate(ts, value);
                }
            }
            else {
                sql += `set @id=\`tv_${name}$id\`(@unit,@user,1`;
                let updateOverride = { id: '@id' };
                for (let k of keys) {
                    let { name: kn, type } = k;
                    let v = value[kn];
                    sql += ',';
                    if (type === 'textid') {
                        sql += `tv_$textid('${v}')`;
                    }
                    else if (kn === 'no') {
                        sql += v ? `'${v}'` : `tv_$no(@unit, '${name}')`;
                    }
                    else {
                        sql += `'${v}'`;
                    }
                    updateOverride[kn] = null;
                }
                sql += ');\n';
                if (fields.length > keys.length + 1) {
                    sql += this.buildUpdate(ts, value, updateOverride);
                }
                sql += exports.retTab;
            }
        }
        sql += exports.retLn;
        return sql;
    }
    buildSaveIDX(ts) {
        let sql = '';
        let { values } = ts;
        for (let value of values) {
            let { id } = value;
            if (id < 0) {
                sql += this.buildIDDelete(ts, -id);
            }
            else {
                sql += this.buildUpsert(ts, value);
            }
        }
        sql += exports.retLn;
        return sql;
    }
    buildSaveIX(ts, ixValue) {
        let sql = '';
        let { values } = ts;
        if (ixValue !== undefined) {
            values = [ixValue];
        }
        for (let value of values) {
            let { ix, id } = value;
            if (ix < 0) {
                sql += this.buildIXDelete(ts, -ix, id);
            }
            else {
                sql += this.buildUpsert(ts, value);
            }
        }
        sql += exports.retLn;
        return sql;
    }
    buildUpsert(ts, value) {
        let { name: tableName, schema } = ts;
        let { fields, exFields } = schema;
        let cols = '', vals = '', dup = '';
        let sqlWriteEx = [];
        let first = true;
        for (let f of fields) {
            let { name, type } = f;
            let v = value[name];
            let val;
            if (v === undefined || v === null) {
                val = 'null';
            }
            else {
                let time;
                if (type === 'textid') {
                    if (typeof v === 'object') {
                        time = v.$time;
                        v = v.value;
                    }
                    val = `tv_$textid('${v}')`;
                }
                else {
                    if (typeof v === 'object') {
                        time = v.$time;
                        v = v.value;
                        val = time === undefined ? `${v}` : `'${v}'`;
                    }
                    else {
                        val = `'${v}'`;
                    }
                }
                switch (name) {
                    default:
                        if (dup.length > 0)
                            dup += ',';
                        dup += '`' + name + '`=values(`' + name + '`)';
                        break;
                    case 'ix':
                    case 'id':
                        break;
                }
                if (exFields) {
                    let exField = exFields.find(v => v.field === name);
                    if (exField !== undefined) {
                        let { field, track, memo, sum, time: timeCanSet } = exField;
                        let valueId = value['id'];
                        let sqlEx = `set @dxValue=\`tv_${tableName}$${field}\`(@unit,@user,${valueId},0,'${v}'`;
                        if (timeCanSet === true) {
                            sqlEx += ',';
                            sqlEx += time !== undefined ? time : 'null';
                        }
                        if (track === true) {
                            let vTrack = value['$track'];
                            sqlEx += ',';
                            sqlEx += (vTrack ? vTrack : 'null');
                        }
                        if (memo === true) {
                            let vMemo = value['$memo'];
                            sqlEx += ',';
                            sqlEx += (vMemo ? `'${vMemo}'` : 'null');
                        }
                        sqlEx += `);\n`;
                        sqlWriteEx.push(sqlEx);
                    }
                }
            }
            if (first === true) {
                first = false;
            }
            else {
                cols += ',';
                vals += ',';
            }
            cols += '\`' + name + '\`';
            vals += val;
        }
        let ignore = '', onDup = '';
        if (dup.length > 0) {
            onDup = `\non duplicate key update ${dup}`;
        }
        else {
            ignore = ' ignore';
        }
        let sql = `insert${ignore} into \`tv_${tableName}\` (${cols})\nvalues (${vals})${onDup};\n`;
        return sql + sqlWriteEx.join('');
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
                case 'ix':
                    where += ' and ix=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
                case 'id':
                    where += ' and id=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
            }
        }
        return sql + where + ';\n';
    }
    buildIXDelete(ts, ix, id) {
        let { name, schema } = ts;
        let { type, exFields } = schema;
        let sql = '';
        if (exFields) {
            for (let exField of exFields) {
                let { field, track, memo } = exField;
                let sqlEx = `set @dxValue=\`tv_${name}$${field}\`(@unit,@user,${ix},-1,null`;
                if (track === true) {
                    sqlEx += ',null';
                }
                if (memo === true) {
                    sqlEx += ',null';
                }
                sqlEx += `);\n`;
                sql += sqlEx;
            }
        }
        sql += 'delete from `tv_' + name + '` where ix=' + ix;
        if (id) {
            sql += ' AND id=';
            if (id < 0)
                id = -id;
            sql += id;
        }
        sql += ';\n';
        return sql;
    }
    buildIDDelete(ts, id) {
        let { name, schema } = ts;
        let sql = '';
        if (id) {
            if (id < 0)
                id = -id;
            sql += 'delete from `tv_' + name + '` where id=' + id;
            if (id) {
                sql += ' AND id=';
                sql += id;
            }
        }
        sql += ';\n';
        return sql;
    }
}
exports.MySqlBuilder = MySqlBuilder;
//# sourceMappingURL=mySqlBuilder.js.map