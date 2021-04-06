"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IXrIXTablesBuilder = exports.IXrTablesBuilder = exports.IXIXTablesBuilder = exports.IXTablesBuilder = exports.TablesBuilder = void 0;
class TablesBuilder {
    constructor(dbName, IDX) {
        this.doneTimeField = false;
        this.dbName = dbName;
        this.IDX = IDX;
        this.cols = '';
        this.tables = '';
    }
    build() {
        this.i = 0;
        this.idJoin = 'id';
        this.buildIDX();
        this.buildIdCol();
    }
    buildCols(schema) {
        let { fields, type, exFields } = schema;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id')
                continue;
            let fv = `t${this.i}.\`${fn}\``;
            if (this.cols.length > 0)
                this.cols += ',';
            this.cols += ft === 'textid' ? `tv_$idtext(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
        }
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
                this.cols += `,t${this.i}.\`$time\` as \`$time\``;
                this.cols += `,tv_$idtext(t${this.i}.\`$field\`) as \`$field\``;
                this.cols += `,t${this.i}.\`$value\` as \`$value\``;
                this.doneTimeField = true;
            }
        }
    }
    buildIDX() {
        if (!this.IDX)
            return;
        if (this.IDX.length === 0)
            return;
        let { name, schema } = this.IDX[0];
        let tbl = `\`${this.dbName}\`.\`tv_${name}\` as t${this.i}`;
        if (this.i === 0) {
            this.tables += tbl;
        }
        else {
            this.tables += ` left join ${tbl} on t0.${this.idJoin}=t${this.i}.id`;
        }
        this.buildCols(schema);
        ++this.i;
        let len = this.IDX.length;
        for (let i = 1; i < len; i++) {
            let { name, schema } = this.IDX[i];
            this.tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${this.i} on t0.${this.idJoin}=t${this.i}.id`;
            this.buildCols(schema);
            ++this.i;
        }
    }
    buildIdCol() {
        this.cols += `, t${this.i - 1}.id`;
    }
}
exports.TablesBuilder = TablesBuilder;
class IXTablesBuilder extends TablesBuilder {
    constructor(dbName, IX, IDX) {
        super(dbName, IDX);
        this.IX = IX;
    }
    build() {
        this.i = 0;
        this.idJoin = 'xi';
        this.buildIX();
        this.buildIdCol();
        this.buildIDX();
    }
    buildIX() {
        let { name, schema } = this.IX;
        this.tables += `\`${this.dbName}\`.\`tv_${name}\` as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
    buildIdCol() {
        if (!this.IDX)
            return;
        if (this.IDX.length === 0)
            return;
        this.cols += `, t${this.i}.id`;
    }
}
exports.IXTablesBuilder = IXTablesBuilder;
class IXIXTablesBuilder extends IXTablesBuilder {
    constructor(dbName, IX, IX1, IDX) {
        super(dbName, IX, IDX);
        this.IX1 = IX1;
    }
    build() {
        this.i = 0;
        this.idJoin = 'xi';
        this.buildIX();
        this.buildIX1();
        this.buildIdCol();
        this.buildIDX();
    }
    buildIX() {
        let { name } = this.IX;
        this.tables += `\`${this.dbName}\`.\`tv_${name}\` as t${this.i}`;
        ++this.i;
    }
    buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join \`${this.dbName}\`.\`tv_${name}\` as t${this.i} on t${this.i - 1}.xi=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXIXTablesBuilder = IXIXTablesBuilder;
class IXrTablesBuilder extends TablesBuilder {
    constructor(dbName, IX, IDX) {
        super(dbName, IDX);
        this.IX = IX;
    }
    build() {
        this.i = 0;
        this.idJoin = 'ix';
        this.buildIXr();
        this.buildIDX();
        this.buildIdCol();
    }
    buildIXr() {
        let { name, schema } = this.IX;
        this.tables += `\`${this.dbName}\`.\`tv_${name}\` as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXrTablesBuilder = IXrTablesBuilder;
class IXrIXTablesBuilder extends IXrTablesBuilder {
    constructor(dbName, IX, IX1, IDX) {
        super(dbName, IX, IDX);
        this.IX1 = IX1;
    }
    build() {
        this.i = 0;
        this.idJoin = 'xi';
        this.buildIXr();
        this.buildIX1();
        this.buildIDX();
        this.buildIdCol();
    }
    buildIXr() {
        let { name } = this.IX;
        this.tables += `\`${this.dbName}\`.\`tv_${name}\` as t${this.i}`;
        //this.buildCols(schema);
        ++this.i;
    }
    buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join \`${this.dbName}\`.\`tv_${name}\` as t${this.i} on t${this.i - 1}.ix=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXrIXTablesBuilder = IXrIXTablesBuilder;
//# sourceMappingURL=tablesBuilder.js.map