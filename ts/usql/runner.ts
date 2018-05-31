import * as _ from 'lodash';
import {getDb, Db} from '../db';

let runners: {[name:string]: Runner} = {};

export async function getRunner(name:string):Promise<Runner> {
    let runner = runners[name];
    if (runner === null) return;
    if (runner !== undefined) return runner;
    let db = getDb(name);
    let isExists = await db.exists();
    if (isExists === false) {
        runners[name] = null;
        return;
    }
    runner = runners[name] = new Runner(db);
    await runner.initSchemas();
    return runner;
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
    isSysChat:boolean;
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
        return await this.db.call('tv$init', [unit, user]);
    }
    async start(unit:number, user:number): Promise<void> {
        return await this.db.call('tv$start', [unit, user]);
    }

    async set(unit:number, name: string, num: number, str: string): Promise<void> {
        await this.db.call('tv$set', [unit, name, num, str]);
    }

    async getStr(unit:number, name: string):Promise<string> {
        let ret = await this.db.tableFromProc('tv$get_str', [unit, name]);
        if (ret.length===0) return undefined;
        return ret[0].str;
    }

    async getNum(unit:number, name: string):Promise<number> {
        let ret = await this.db.tableFromProc('tv$get_num', [unit, name]);
        if (ret.length===0) return undefined;
        return ret[0].num;
    }

    async loadSchemas(): Promise<{id:number, name:string, type:number, version:number, schema:string, run:string}[]> {
        return await this.db.call('tv$schemas', undefined);
    }
    async saveSchema(unit:number, user:number, id:number, name:string, type:number, schema:string, run:string):Promise<any> {
        return await this.db.call('tv$schema', [unit, user, id, name, type, schema, run]);
    }
    async loadConstStrs(): Promise<{[name:string]:number}[]> {
        return await this.db.call('tv$const_strs', undefined);
    }
    async saveConstStr(type:string): Promise<number> {
        return await this.db.call('tv$const_str', [type]);
    }
    async loadSchemaVersion(name:string, version:string): Promise<string> {
        return await this.db.call('tv$schema_version', [name, version]);
    } 

    async tuidGet(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.call('tv' + tuid, [unit, user, id]);
    }
    async tuidGetAll(tuid:string, unit:number, user:number): Promise<any> {
        return await this.db.call('tv' + tuid + '_all', [unit, user]);
    }
    async tuidProxyGet(tuid:string, unit:number, user:number, id:number, type:string): Promise<any> {
        return await this.db.call('tv' + tuid + '_proxy', [unit, user, id, type]);
    }
    async tuidIds(tuid:string, unit:number, user:number, ids:string): Promise<any> {
        return await this.db.call('tv' + tuid + '_ids', [unit, user, ids]);
    }
    async tuidMain(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.call('tv' + tuid + '_main', [unit, user, id]);
    }
    async tuidSave(tuid:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv' + tuid + '_save', [unit, user, ...params]);
    }
    async tuidSeach(tuid:string, unit:number, user:number, key:string, pageStart:number, pageSize:number): Promise<any> {
        return await this.db.tablesFromProc('tv' + tuid + '_search', [unit, user, key, pageStart, pageSize]);
    }
    async sheetSave(sheet:string, unit:number, user:number, discription:string, data:string): Promise<{}> {
        return await this.db.call('tv$sheet_save', [unit, user, sheet, discription, data]);
    }
    async tuidSlaveSave(tuid:string, slave:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv' + tuid + '_' + slave + '_save', [unit, user, ...params]);
    }
    async tuidSlaves(tuid:string, unit:number, user:number, slave:string, masterId:number, pageStart:number, pageSize:number): Promise<any> {
        return await this.db.tablesFromProc('tv' + tuid + '_' + slave + '_ids', [unit, user, masterId, pageStart, pageSize]);
    }
    async sheetProcessing(sheetId:number):Promise<void> {
        await this.db.call('tv$sheet_processing', [sheetId]);
    }
    async sheetAct(sheet:string, state:string, action:string, unit:number, user:number, id:number, flow:number): Promise<any[]> {
        let sql = state === '$'?
            'tv' + sheet + '_' + action :
            'tv' + sheet + '_' + state + '_' + action;
        return await this.db.call(sql, [unit, user, id, flow, action]);
    }
    async sheetStates(sheet:string, state:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv$sheet_state';
        return await this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
    }
    async sheetStateCount(sheet:string, unit:number, user:number) {
        let sql = 'tv$sheet_state_count';
        return await this.db.call(sql, [unit, user, sheet]);
    }

    async getSheet(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv$sheet_id';
        return await this.db.call(sql, [unit, user, sheet, id]);
    }

    async sheetArchives(sheet:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv$archives';
        return await this.db.call(sql, [unit, user, sheet, pageStart, pageSize]);
    }

    async sheetArchive(unit:number, user:number, sheet:string, id:number) {
        let sql = 'tv$archive_id';
        return await this.db.call(sql, [unit, user, sheet, id]);
    }

    async action(action:string, unit:number, user:number, data:string): Promise<any> {
        //let schema = await this.getSchema(action);
        let result = await this.db.callEx('tv' + action, [unit, user, data]);
        //this.actionRun(schema, result);
        return result;
    }

    async query(query:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv' + query, [unit, user, ...params]);
    }

    async unitxPost(msg:any):Promise<void> {
        let {service, unit, busOwner, bus, face, data} = msg;
        let schema = this.buses[busOwner + '/' + bus];
        if (schema === undefined) return;
        let sql = 'tv' + schema.name + '_' + face;
        return await this.db.call(sql, [unit, 0, data]);
    }

    async initSchemas() {
        if (this.schemas !== undefined) return;
        this.app = await this.getStr(0, 'app');
        this.author = await this.getStr(0, 'author');
        this.version = await this.getStr(0, 'version');
        this.isSysChat = (this.app === '$chat' || this.app === 'chat') 
            && this.author === 'henry';
        let rows = await this.loadSchemas();
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
        console.log('schema: %s', JSON.stringify(this.schemas));
        this.buildAccesses();
    }

    private buildAccesses() {
        this.access = {};
        //let accesses = this.app.accesses;
        for (let a in this.schemas) {
            let access = this.schemas[a].call;
            if (access.type !== 'access') continue;
            let acc = this.access[a] = {};
            for (let item of access.list) {
                let len = item.length;
                let i0 = item[0], i1, a2, a3;
                let entity = this.schemas[i0].call;
                let type = entity && entity.type;
                let id = entity && entity.id;
                switch (len) {
                    case 1:
                        acc[i0] = type + '|' + id + this.tuidProxies(entity);
                        break;
                    case 2:
                        a2 = acc[i0];
                        if (a2 === undefined) {
                            a2 = acc[i0] = {'$': type, id: id};
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[i0] = {'$': type, '#': true, id: id};
                        }
                        a2[item[1]] = true;
                        break;
                    case 3:
                        a2 = acc[i0];
                        if (a2 === undefined) {
                            a2 = acc[i0] = {'$': type, id: id};
                        }
                        else if (typeof a2 !== 'object') {
                            a2 = acc[i0] = {'$': type, '#': true, id: id};
                        }
                        i1 = item[1];
                        a3 = a2[i1];
                        if (a3 === undefined) {
                            a3 = a2[i1] = {};
                        }
                        else if (a3 === true) {
                            a3 = a2[i1] = {'#': true};
                        }
                        a3[item[2]] = true;
                    break;
                }
            }
        }
        console.log('access: %s', JSON.stringify(this.access));
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
        await this.initSchemas();
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
        return this.schemas[name];
    }
}
