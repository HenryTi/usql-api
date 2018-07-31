import * as _ from 'lodash';
import {getDb, Db} from '../db';
import { debug } from 'util';

let runners: {[name:string]: Runner} = {};

export async function getRunner(name:string):Promise<Runner> {
    let runner = runners[name];
    if (runner === null) return;
    if (runner === undefined) {
        let db = getDb(name);
        let isExists = await db.exists();
        if (isExists === false) {
            runners[name] = null;
            return;
        }
        runner = new Runner(db);
    }
    await runner.initSchemas();
    return runners[name] = runner;
}

export function resetRunner(name:string) {
    runners[name] = undefined;
}

export function createRunner(name:string) { //, dbName:string) {
    let runner = runners[name];
    if (runner === null) return;
    if (runner !== undefined) return runner;
    let db = getDb(name);
    db.setExists();
    return runners[name] = new Runner(db);
}

export class Runner {
    private db:Db;
    private access:any;
    private types: {[tyep:string]: number};
    private schemas: {[entity:string]: {call:any; run:any;}};
    private buses:{[url:string]:any}; // 直接查找bus
    //isSysChat:boolean;
    app: string;
    author: string;
    version: string;

    constructor(db:Db) {
        this.db = db;
    }

    //sysTableCount(db:Db): Promise<number> {
    //    return this.db.call('tv$sysTableCount', undefined);
    //}
    sql(sql:string, params:any[]): Promise<any> {
        return this.db.sql(sql, params);
    }
    createDatabase(): Promise<void> {
        return this.db.createDatabase();
    }

    async init(unit:number, user:number): Promise<void> {
        return await this.db.call('tv_$init', [unit, user]);
    }
    async start(unit:number, user:number): Promise<void> {
        return await this.db.call('tv_$start', [unit, user]);
    }

    async set(unit:number, name: string, num: number, str: string): Promise<void> {
        await this.db.call('tv_$set', [unit, name, num, str]);
    }

    async getStr(unit:number, name: string):Promise<string> {
        let ret = await this.db.tableFromProc('tv_$get_str', [unit, name]);
        if (ret.length===0) return undefined;
        return ret[0].str;
    }

    async getNum(unit:number, name: string):Promise<number> {
        let ret = await this.db.tableFromProc('tv_$get_num', [unit, name]);
        if (ret.length===0) return undefined;
        return ret[0].num;
    }

    async loadSchemas(hasSource:boolean): Promise<{id:number, name:string, type:number, version:number, schema:string, run:string}[]> {
        return await this.db.call('tv_$schemas', [hasSource===true?1:0]);
    }
    async saveSchema(unit:number, user:number, id:number, name:string, type:number, schema:string, run:string):Promise<any> {
        return await this.db.call('tv_$schema', [unit, user, id, name, type, schema, run]);
    }
    async loadConstStrs(): Promise<{[name:string]:number}[]> {
        return await this.db.call('tv_$const_strs', undefined);
    }
    async saveConstStr(type:string): Promise<number> {
        return await this.db.call('tv_$const_str', [type]);
    }
    async loadSchemaVersion(name:string, version:string): Promise<string> {
        return await this.db.call('tv_$schema_version', [name, version]);
    } 

    async tuidGet(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.call('tv_' + tuid, [unit, user, id]);
    }
    async tuidArrGet(tuid:string, arr:string, unit:number, user:number, owner:number, id:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$id', [unit, user, owner, id]);
    }
    async tuidGetAll(tuid:string, unit:number, user:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '$all', [unit, user]);
    }
    async tuidGetArrAll(tuid:string, arr:string, unit:number, user:number, owner:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$all', [unit, user, owner]);
    }
    async tuidProxyGet(tuid:string, unit:number, user:number, id:number, type:string): Promise<any> {
        return await this.db.call('tv_' + tuid + '$proxy', [unit, user, id, type]);
    }
    async tuidIds(tuid:string, unit:number, user:number, ids:string): Promise<any> {
        return await this.db.call('tv_' + tuid + '$ids', [unit, user, ids]);
    }
    async tuidMain(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '$main', [unit, user, id]);
    }
    async tuidSave(tuid:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '$save', [unit, user, ...params]);
    }
    async tuidArrSave(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$save', [unit, user, ...params]);
    }
    async tuidArrPos(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$pos', [unit, user, ...params]);
    }
    async tuidSeach(tuid:string, unit:number, user:number, key:string, pageStart:number, pageSize:number): Promise<any> {
        return await this.db.tablesFromProc('tv_' + tuid + '$search', [unit, user, key, pageStart, pageSize]);
    }
    async sheetSave(sheet:string, unit:number, user:number, app:number, api:number, discription:string, data:string): Promise<{}> {
        return await this.db.call('tv_$sheet_save', [unit, user, sheet, app, api, discription, data]);
    }
    async tuidBindSlaveSave(tuid:string, slave:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + slave + '$save', [unit, user, ...params]);
    }
    async tuidBindSlaves(tuid:string, unit:number, user:number, slave:string, masterId:number, pageStart:number, pageSize:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + slave + '$ids', [unit, user, masterId, pageStart, pageSize]);
    }
    async sheetProcessing(sheetId:number):Promise<void> {
        await this.db.call('tv_$sheet_processing', [sheetId]);
    }
    async sheetAct(sheet:string, state:string, action:string, unit:number, user:number, id:number, flow:number): Promise<any[]> {
        let sql = state === '$'?
            'tv_' + sheet + '_' + action :
            'tv_' + sheet + '_' + state + '_' + action;
        return await this.db.callEx(sql, [unit, user, id, flow, action]);
    }
    async sheetStates(sheet:string, state:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$sheet_state';
        return await this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
    }
    async sheetStateCount(sheet:string, unit:number, user:number) {
        let sql = 'tv_$sheet_state_count';
        return await this.db.call(sql, [unit, user, sheet]);
    }

    async getSheet(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv_$sheet_id';
        return await this.db.call(sql, [unit, user, sheet, id]);
    }

    async sheetArchives(sheet:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$archives';
        return await this.db.call(sql, [unit, user, sheet, pageStart, pageSize]);
    }

    async sheetArchive(unit:number, user:number, sheet:string, id:number) {
        let sql = 'tv_$archive_id';
        return await this.db.call(sql, [unit, user, sheet, id]);
    }

    async action(action:string, unit:number, user:number, data:string): Promise<any> {
        let result = await this.db.callEx('tv_' + action, [unit, user, data]);
        return result;
    }

    async query(query:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + query, [unit, user, ...params]);
    }

    async busPost(msg:any):Promise<void> {
        let {service, unit, busOwner, bus, face, data} = msg;
        let schema = this.buses[busOwner + '/' + bus];
        if (schema === undefined) return;
        let sql = 'tv_' + schema.name + '_' + face;
        return await this.db.call(sql, [unit, 0, data]);
    }

    async initSchemas() {
        if (this.schemas !== undefined) return;
        this.app = await this.getStr(0, 'app');
        this.author = await this.getStr(0, 'author');
        this.version = await this.getStr(0, 'version');
        //this.isSysChat = (this.app === '$unitx' || this.app === 'unitx') 
        //    && this.author === 'henry';
        let rows = await this.loadSchemas(false);
        console.log('schema raw rows: %s', JSON.stringify(rows));
        this.schemas = {};
        this.buses = {};
        for (let row of rows) {
            let schema = JSON.parse(row.schema);
            let run = JSON.parse(row.run);
            schema.id = row.id;
            schema.version = row.version;
            this.schemas[row.name] = {
                call: schema,
                run: run,
            }
            let {type, url} = schema;
            if (type === 'bus') {
                this.buses[url] = schema;
            }
        }
        for (let i in this.schemas) {
            let schema = this.schemas[i];
            let {call} = schema;
            let {type} = call;
            let tuids:any[];
            switch (type) {
                default: continue;
                case 'tuid': 
                    tuids = this.tuidRefTuids(call);
                    this.tuidSlaves(call);
                    break;
                case 'action': tuids = this.actionRefTuids(call); break;
                case 'sheet': tuids = this.sheetRefTuids(call); break;
                case 'query': tuids = this.queryRefTuids(call); break;
                case 'book': tuids = this.bookRefTuids(call); break;
            }
            if (tuids.length === 0) continue;
            call.tuids = tuids;
        }

        for (let i in this.schemas) {
            let schema = this.schemas[i];
            let {call} = schema;
            if (call === undefined) continue;
            let circular = false;
            let arr:any[] = [call];

            let text = JSON.stringify(call, (key:string, value:any) => {
                if (key === 'tuids') {
                    let ret:any[] = [];
                    for (let v of value) {
                        if (arr.findIndex(a => a === v) >= 0) {
                            circular = true;
                        }
                        else {
                            arr.push(v);
                            ret.push(v);
                        }
                    }
                    return ret.length > 0? ret : undefined;
                }
                else if (key !== '' && value === call) {
                    // slave in tuid
                    circular = true;
                    return undefined;
                }
                else return value;
            });
            if (circular) {
                let newCall = JSON.parse(text);
                schema.call = newCall;
            }
        }

        //console.log('schema: %s', JSON.stringify(this.schemas));
        this.buildAccesses();
    }

    private tuidSlaves(schema: any) {
        let {slaves} = schema;
        if (slaves === undefined) return;
        let ret = {} as any;
        function getCall(s:string) {
            let c = this.schemas[s];
            if (c === undefined) return;
            return c.call;
        };
        let call = getCall.bind(this);
        for (let slave of slaves) {
            let book = call(slave);
            ret[slave] = {
                tuid: call(book.slave),
                book: book,
                page: call(slave+'$page$'),
                pageSlave: call(slave+'$page$slave$'),
                all: call(slave+'$all$'),
                add: call(slave+'$add$'),
                del: call(slave+'$del$'),
            }
        }
        schema.slaves = ret;
    }

    private fieldsTuids(fields:any[], tuids:any[]) {
        if (fields === undefined) return;
        for (let f of fields) {
            let {tuid} = f;
            if (tuid === undefined) continue;
            let schema = this.schemas[tuid.toLowerCase()];
            if (schema === undefined) {
                continue;
            }
            tuids.push(schema.call);
        }
    }
    private arrsTuids(arrs:any[], tuids:any[]) {
        if (arrs === undefined) return;
        for (let arr of arrs) {
            this.fieldsTuids(arr.fields, tuids);
        }
    }
    private returnsTuids(returns:any[], tuids:any[]) {
        if (returns === undefined) return;
        for (let ret of returns) {
            this.fieldsTuids(ret.fields, tuids);
        }
    }
    // 建立tuid, action, sheet, query, book里面引用到的tuids
    private tuidRefTuids(schema: any):any[] {
        let tuids:any[] = [];
        this.fieldsTuids(schema.fields, tuids);
        return tuids;
    }
    private actionRefTuids(schema: any):any[] {
        let tuids:any[] = [];
        this.fieldsTuids(schema.fields, tuids);
        this.arrsTuids(schema.arrs, tuids);
        this.returnsTuids(schema.returns, tuids);
        return tuids;
    }
    private sheetRefTuids(schema: any):any[] {
        let tuids:any[] = [];
        this.fieldsTuids(schema.fields, tuids);
        this.arrsTuids(schema.arrs, tuids);
        let {states} = schema;
        if (states !== undefined) {
            for (let state of states) {
                let {actions} = state;
                if (actions === undefined) continue;
                for (let action of actions) {
                    this.returnsTuids(action.returns, tuids);
                }
            }
        }
        return tuids;
    }
    private queryRefTuids(schema: any):any[] {
        let tuids:any[] = [];
        this.fieldsTuids(schema.fields, tuids);
        this.returnsTuids(schema.returns, tuids);
        return tuids;
    }
    private bookRefTuids(schema: any):any[] {
        let tuids:any[] = [];
        this.fieldsTuids(schema.fields, tuids);
        this.returnsTuids(schema.returns, tuids);
        return tuids;
    }

    private buildAccesses() {
        this.access = {};
        //let accesses = this.app.accesses;
        for (let a in this.schemas) {
            let la = a.toLowerCase();
            let schema = this.schemas[la];
            if (schema === undefined) continue;
            let access = schema.call;
            if (access.type !== 'access') continue;
            let acc = this.access[la] = {};
            for (let item of access.list) {
                let len = item.length;
                let i0 = item[0], i1, li1, a2, a3;
                let li0 = i0.toLowerCase();
                schema = this.schemas[li0];
                if (schema === undefined) continue;
                let entity = schema.call;
                let type = entity && entity.type;
                let id = entity && entity.id;
                switch (len) {
                    case 1:
                        acc[li0] = type + '|' + id + this.tuidProxies(entity);
                        if (type === 'tuid') this.addSlavesAccess(acc, entity);
                        break;
                    case 2:
                        a2 = acc[li0];
                        if (a2 === undefined) {
                            a2 = acc[li0] = {'$': type, id: id};
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[li0] = {'$': type, '#': true, id: id};
                        }
                        i1 = item[1];
                        li1 = i1.toLowerCase();
                        a2[li1] = true;
                        break;
                    case 3:
                        a2 = acc[li0];
                        if (a2 === undefined) {
                            a2 = acc[li0] = {'$': type, id: id};
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[li0] = {'$': type, '#': true, id: id};
                        }
                        i1 = item[1];
                        li1 = i1.toLowerCase();
                        a3 = a2[li1];
                        if (a3 === undefined) {
                            a3 = a2[li1] = {};
                        }
                        else if (a3 === true) {
                            a3 = a2[li1] = {'#': true};
                        }
                        a3[item[2].toLowerCase] = true;
                    break;
                }
            }
        }
        //console.log('access: %s', JSON.stringify(this.access));
    }

    private addSlavesAccess(acc:any, entity:any) {
        let {slaves} = entity;
        if (slaves === undefined) return;
        for (let i in slaves) {
            /*tuid: call(book.slave),
            book: book,
            page: call(slave+'$page$'),
            all: call(slave+'$all$'),
            add: call(slave+'$add$'),
            del: call(slave+'$del$'),*/
            let {tuid, book, page, pageSlave, all, add, del} = slaves[i];
            this.addEntityAccess(acc, tuid);
            this.addEntityAccess(acc, book);
            this.addEntityAccess(acc, page);
            this.addEntityAccess(acc, pageSlave);
            this.addEntityAccess(acc, all);
            this.addEntityAccess(acc, add);
            this.addEntityAccess(acc, del);
        }
    }

    private addEntityAccess(acc:any, entity:any) {
        let {name, type, id} = entity;
        acc[name.toLowerCase()] = type + '|' + id + this.tuidProxies(entity);
    } 

    private tuidProxies(tuid:any) {
        let ret = '';
        if (tuid === undefined) return ret;
        if (tuid.type !== 'tuid') return ret;
        let proxies = tuid.proxies;
        if (proxies === undefined) return ret;
        for (let i in proxies) {
            ret += '|' + i;
        }
        return ret;
    }

    async getAccesses(acc:string[]):Promise<any> {
        let reload = await this.getNum(0, 'reloadSchemas');
        if (reload === 1) {
            this.schemas = undefined;
            await this.set(0, 'reloadSchemas', 0, null);
        }
        //await this.initSchemas();
        let ret = {} as any;
        if (acc === undefined) {
            for (let a in this.access) {
                _.merge(ret, this.access[a]);
            }
        }
        else {
            for (let a of acc) _.merge(ret, this.access[a]);
        }
        return ret;
    }

    getSchema(name:string):any {
        return this.schemas[name.toLowerCase()];
    }
}
