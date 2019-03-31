import * as fs from 'fs';
import * as path from 'path';
import { Db } from "./db";

const bufferSize = 7;

export class ImportData {
    private db: Db;
    private entity: string;
    private schema: any;
    private filePath: string;
    //private rs: fs.ReadStream;
    private buffer: string;
    private bufferPrev: string;
    private p: number;

    // entity: 'product';
    // entity: 'product-pack'
    constructor(db: Db) {
        this.db = db;
    }

    private readLine():any[] {
        let ret:string[] = [];
        let loop: boolean = true;
        while (loop) {
            let len = this.buffer.length;
            let cur:number, c:number = 0;
            let i = this.p;
            for (; i<len; i++) {
                c = this.buffer.charCodeAt(i);
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
            ret.push(val);
        }
        return ret;
    }

    private to(type:string, val:string):any {
        switch (type) {
            default: return val;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(val);
        }
    }

    async importData(entity:string, schema: any, filePath: string) {
        debugger;
        this.entity = entity;
        this.schema = schema;
        this.bufferPrev = '';
        this.filePath = path.resolve(filePath);
        this.buffer = await readFileAsync(this.filePath, 'utf8');
        this.p = 0;

        //this.rs = fs.createReadStream(this.filePath);
        //this.rs.setEncoding('utf8');

        //let {name, type} = this.schema;
        let type= 'tuid';
        switch (type) {
            case 'tuid': await this.importTuid(); break;
            case 'map': await this.importMap(); break;
        }

        //this.rs.close();
    }

    private async importTuid() {
        for (;;) {
            let line = this.readLine();
            if (line === undefined) break;
            console.log(line);
        }
    }

    private async importMap() {
        for (;;) {
            let line = this.readLine();
            if (line === undefined) break;
            console.log(line);
        }
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
