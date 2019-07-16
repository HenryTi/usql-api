import * as fs from 'fs';
import { Db } from "../db";
import { Runner } from '../runner';
import { Field, Header } from './field';

// 导入文件表头
// $id  $owner  字段1    字段2   字段3@字段2

// 字段3是div，其owner是字段2
// 如果是div entity，则必须有$owner字段

// 如果字段描述：字段3@/字段2，那么，div的no就是 owner的no/div no；

export abstract class ImportData {
    // entity: 'product';
    // entity: 'product-pack'
    static async exec(runner:Runner, unit:number, db: Db, source:string, entity:string, filePath: string): Promise<void> {
        let importData:ImportData;
        let parts = entity.split('.');
        entity = parts[0];
        let div = parts[1];

        let schema:any = runner.getSchema(entity);
        let logger = console;

        if (schema === undefined) {
            logger.error('unknown entity %s', entity);
            return;
        }

        let {type} = schema;
        switch (type) {
            case 'tuid':
                if (div === undefined)
                    importData = new ImportTuid;
                else
                    importData = new ImportTuidDiv;
                break;
            case 'map':
                importData = new ImportMap;
                break;
        }
        importData.logger = logger;
        importData.runner = runner;
        importData.unit = unit;
        importData.db = db;
        importData.source = source;
        importData.entity = entity;
        importData.div = div;
        importData.schema = schema.call;
        importData.filePath = filePath;
        await importData.importData();
    }

    private schema: any;
    private filePath: string;
    private buffer: string;
    private bufferPrev: string;
    private p: number;
    private fields: Field[] = [];

    protected logger: Console;
    protected unit: number;
    protected db: Db;
    protected source: string;
    protected entity: string;
    protected div: string;
    protected runner: Runner;

    private readLine():any[] {
        let ret:string[] = [];
        let loop: boolean = true;
        while (loop) {
            let len = this.buffer.length;
            let cur:number, c:number = 0;
            let i = this.p;
            for (; i<len; i++) {
                c = this.buffer.charCodeAt(i);
                if (c === 65279) continue;  // UTF8-BOM
                if (c === 9) {
                    cur = i;
                    break;
                }
                if (c === 10) {
                    cur = i;
                    loop = false;
                    break;
                }
            }
            let val:string;
            if (i === len) {
                if (this.p === 0)
                    this.bufferPrev = this.bufferPrev + this.buffer;
                else
                    this.bufferPrev = this.buffer.substring(this.p);
                this.buffer = null; //this.rs.read(bufferSize);
                if (this.buffer === null) {
                    if (this.bufferPrev === '' || ret.length === 0) return;
                    val = this.bufferPrev;
                    loop = false;
                }
            }
            else {
                if (this.p === 0) {
                    val = this.bufferPrev + this.buffer.substring(0, cur);
                    this.bufferPrev = '';
                }
                else {
                    val = this.buffer.substring(this.p, cur);
                }
                if (c === 10) val = val.trim();
                this.p = cur+1;
            }
            if (val === 'NULL') val = undefined;
            ret.push(val);
        }
        if (ret.length === 1 && ret[0] === '') return [];
        return ret;
    }

    private to(type:string, val:string):any {
        if (val === undefined || val === '') return undefined;
        switch (type) {
            default: return val;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(val);
        }
    }

    private buildHeader(line: string[]):boolean {
        let header: Header = {};
        let len = line.length;
        let divOwner:{div:string; owner:string}[] = [];
        for (let i=0; i<len; i++) {
            let f = line[i];
            let pos = f.indexOf('@');
            if (pos > 0) {
                let p0 = f.substr(0, pos);
                let p1 = f.substr(pos+1);
                header[p0] = i;
                divOwner.push({div:p0, owner:p1});
            }
            else {
                header[line[i]] = i;
            }
        }
        for (let i=0; i<divOwner.length; i++) {
            let {div, owner} = divOwner[i];
            if (owner[0] === '/') {
                owner = owner.substr(1);
            }
            let ownerIndex = header[owner];
            if (ownerIndex === undefined) {
                this.logger.log(`${div} of ${owner} not exists`);
                return false;
            }
            header[div+'$owner'] = ownerIndex;
        }

        let neededFields = this.checkHeader(header);
        if (neededFields !== undefined) {
            this.logger.log('导入表必须包含字段：', neededFields);
            return false;
        }

        for (let i=0; i<len; i++) {
            let field:Field;
            let fieldName = line[i];
            switch (fieldName) {
                case '$id':
                    field = Field.createIdField(this.runner, this.source, this.entity, this.div);
                    field.name = fieldName;
                    field.colIndex = header[fieldName];
                    break;
                case '$owner':
                    //field = Field.createOwnerField(this.runner, this.entity, this.div, header);
                    // field.name = fieldName;
                    //field.colIndex = header[fieldName];
                    break;
                case '$user':
                    field = Field.createUserField();
                    field.name = fieldName;
                    field.colIndex = header[fieldName];
                    break;
                default: 
                    field = Field.create(this.runner, this.schema, fieldName, header, this.source);
                    break;
            }
            this.fields.push(field);
        }

        return true;
    }

    async importData() {
        this.bufferPrev = '';
        this.buffer = await readFileAsync(this.filePath, 'utf8');
        this.p = 0;

        // build header
        for (;;) {
            let line = this.readLine();
            if (line === undefined) break;
            if (line.length === 0) continue;
            if (this.buildHeader(line) === false) return;
            break;
        }
        
        for (;;) {
            let line = this.readLine();
            if (line === undefined) break;
            if (line.length === 0) continue;
            let values = await this.mapValues(line);
            await this.saveItem(values);
        }
    }

    protected checkHeader(header:Header):string[] {return undefined};

    private async mapValues(line:any[]):Promise<any[]> {
        let values:any[] = [];
        let len = line.length;
        for (let i=0; i<len; i++) {
            let field = this.fields[i];
            let v:any;
            if (field !== undefined) {
                v = field.getValue(line);
                if (v === null) {
                    v = await field.getId(this.unit, line);
                }
            }
            values.push(v);
        }
        return values;
    }

    protected async saveItem(values:any[]): Promise<void> {
        this.logger.log('to be saved: ', values);
    }
}

class ImportTuid extends ImportData {
    protected async saveItem(values:any[]): Promise<void> {
        await this.runner.tuidSave(this.entity, this.unit, undefined, values);
    }
}

class ImportTuidDiv extends ImportTuid {
    protected checkHeader(header:Header):string[] {
        let $owner = header['$owner'];
        if ($owner !== undefined) return undefined;
        return ['$owner'];
    };
}

class ImportMap extends ImportData {
    protected async saveItem(values:any[]): Promise<void> {
        await this.runner.mapSave(this.entity, this.unit, undefined, values);
        console.log('import map ', values);
    }
}

async function readFileAsync(filename?:string, code?:string) {
    return new Promise<string>(function (resolve, reject) {
        try {
            fs.readFile(filename, code, function(err, buffer){
                if (err) reject(err); else resolve(buffer);
            });
        } catch (err) {
            reject(err);
        }
    });
};
