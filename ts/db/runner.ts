import * as _ from 'lodash';
import {getDb, Db} from './db';
import { packReturns } from '../core/packReturn';
import { ImportData } from './importData';

const runners: {[name:string]: Runner} = {};

export async function getRunner(name:string):Promise<Runner> {
    name = name.toLowerCase();
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
        runners[name] = runner;
    }
    await runner.init();
    return runner;
}

interface EntityAccess {
    name: string;
    access: any;
}

interface SheetRun {
    onsave: boolean;
    verify: any[];      // returns;
}

export class Runner {
    private db:Db;
    private access:any;
    private schemas: {[entity:string]: {type:string, call:any; run:any;}};
    private accessSchemaArr: any[];
    private tuids: {[name:string]: any};
    private buses:{[url:string]:any}; // 直接查找bus
    private setting: {[name:string]: any};
    private entityColl: {[id:number]: EntityAccess};
    private uqId: number;
    private sheetRuns: {[sheet:string]: SheetRun};

    uqOwner: string;
    uq: string;
    author: string;
    version: string;
    importTuids:any[];
    // tuid的值，第一个是tuidname，随后用tab分隔的map
    froms: {[from:string]:{[tuid:string]:{tuid?:string, maps?:string[], tuidObj?:any, mapObjs?:{[map:string]:any}}}};

    constructor(db:Db) {
        this.db = db;
        this.setting = {};
    }

    getDb():string {return this.db.getDbName()}

    sql(sql:string, params:any[]): Promise<any> {
        return this.db.sql(sql, params);
    }
    async procCall(proc:string, params:any[]): Promise<any> {
        return await this.db.call(proc, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        return await this.db.call('tv_' + proc, params);
    }
    createDatabase(): Promise<void> {
        return this.db.createDatabase();
    }

    async setTimezone(unit:number, user:number): Promise<void> {
        return await this.db.call('tv_$set_timezone', [unit, user]);
    }
    async start(unit:number, user:number): Promise<void> {
        return await this.db.call('tv_$start', [unit, user]);
    }
    async initResDb(resDbName:string): Promise<void> {
        await this.db.initResDb(resDbName);
    }
    async setSetting(unit:number, name: string, value: string): Promise<void> {
        name = name.toLowerCase();
        await this.db.call('tv_$set_setting', [unit, name, value]);
        if (unit === 0) {
            let n = Number(value);
            this.setting[name] = n === NaN? value : n;
        }
    }

    async getSetting(unit:number, name: string):Promise<any> {
        name = name.toLowerCase();
        let ret = await this.db.tableFromProc('tv_$get_setting', [unit, name]);
        if (ret.length===0) return undefined;
        let v = ret[0].value;
        if (unit === 0) {
            let n = Number(v);
            v = this.setting[name] = isNaN(n)===true? v : n;
        }
        return v;
    }

    async loadSchemas(hasSource:boolean): Promise<any[][]> {
        return await this.db.tablesFromProc('tv_$entitys', [hasSource===true?1:0]);
    }
    async saveSchema(unit:number, user:number, id:number, name:string, type:number, schema:string, run:string):Promise<any> {
        return await this.db.call('tv_$entity', [unit, user, id, name, type, schema, run]);
    }
    async loadConstStrs(): Promise<{[name:string]:number}[]> {
        return await this.db.call('tv_$const_strs', undefined);
    }
    async saveConstStr(type:string): Promise<number> {
        return await this.db.call('tv_$const_str', [type]);
    }
    async loadSchemaVersion(name:string, version:string): Promise<string> {
        return await this.db.call('tv_$entity_version', [name, version]);
    } 

    isTuidOpen(tuid:string) {
        tuid = tuid.toLowerCase();
        let t = this.tuids[tuid];
        if (t === undefined) return false;
        if (t.isOpen === true) return true;
        return false;
    }
    getTuid(tuid:string) {
        tuid = tuid.toLowerCase();
        let ret = this.tuids[tuid];
        return ret;
    }
    getMap(map:string):any {
        map = map.toLowerCase();
        let m = this.schemas[map];
        if (m === undefined) return;
        if (m.type === 'map') return m;
    }

    async tuidGet(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.callEx('tv_' + tuid, [unit, user, id]);
    }
    async tuidArrGet(tuid:string, arr:string, unit:number, user:number, owner:number, id:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$id', [unit, user, owner, id]);
    }
    async tuidGetAll(tuid:string, unit:number, user:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '$all', [unit, user]);
    }
    async tuidVid(tuid:string, unit:number, uniqueValue:any): Promise<any> {
        let proc = `tv_${tuid}$vid`;
        return await this.db.call(proc, [unit, uniqueValue]);
    }
    async tuidArrVid(tuid:string, arr:string, unit:number, uniqueValue:any): Promise<any> {
        let proc = `tv_${tuid}_${arr}$vid`;
        return await this.db.call(proc, [unit, uniqueValue]);
    }
    async tuidGetArrAll(tuid:string, arr:string, unit:number, user:number, owner:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$all', [unit, user, owner]);
    }
    async tuidProxyGet(tuid:string, unit:number, user:number, id:number, type:string): Promise<any> {
        return await this.db.call('tv_' + tuid + '$proxy', [unit, user, id, type]);
    }
    async tuidIds(tuid:string, arr:string, unit:number, user:number, ids:string): Promise<any> {
        let proc = 'tv_' + tuid;
        if (arr !== '$') proc += '_' + arr;
        proc += '$ids';
        let ret = await this.db.call(proc, [unit, user, ids]);
        return ret;
    }
    async tuidMain(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.db.call('tv_' + tuid + '$main', [unit, user, id]);
    }
    async tuidSave(tuid:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '$save', [unit, user, ...params]);
    }
    async tuidSetStamp(tuid:string, unit:number, params:any[]): Promise<void> {
        return await this.db.call('tv_' + tuid + '$stamp', [unit, ...params]);
    }
    async tuidArrSave(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$save', [unit, user, ...params]);
    }
    async tuidArrPos(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + tuid + '_' + arr + '$pos', [unit, user, ...params]);
    }
    async tuidSeach(tuid:string, unit:number, user:number, arr:string, key:string, pageStart:number, pageSize:number): Promise<any> {
        let proc = 'tv_' + tuid + '$search';
        return await this.db.tablesFromProc(proc, [unit, user, key||'', pageStart, pageSize]);
    }
    async tuidArrSeach(tuid:string, unit:number, user:number, arr:string, ownerId:number, key:string, pageStart:number, pageSize:number): Promise<any> {
        let proc = `tv_${tuid}_${arr}$search`;
        return await this.db.tablesFromProc(proc, [unit, user, ownerId, key||'', pageStart, pageSize]);
    }
    async mapSave(map:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.db.call('tv_' + map + '$save', [unit, user, ...params]);
    }
    async importVId(unit:number, user:number, source:string, tuid:string, arr:string, no:string): Promise<number> {
        let proc = `tv_$import_vid`;
        let ret = await this.db.tableFromProc(proc, [unit, user, source, tuid, arr, no]);
        return ret[0].vid;
    }
    async sheetVerify(sheet:string, unit:number, user:number, data:string):Promise<string> {
        let sheetRun = this.sheetRuns[sheet];
        if (sheetRun === undefined) return;
        let {verify} = sheetRun;
        if (verify === undefined) return;
        let ret = await this.db.call(`tv_${sheet}_$verify`, [unit, user, data]);
        let {length} = verify;
        if (length === 0) {
            if (ret === undefined) return 'fail';
            return;
        }
        if (length === 1) ret = [ret];
        for (let i=0; i<length; i++) {
            let t = ret[0];
            if (t.length > 0) {
                return packReturns(verify, ret);
            }
        }
        return;
    }
    async sheetSave(sheet:string, unit:number, user:number, app:number, discription:string, data:string): Promise<{}> {
        return await this.db.call('tv_$sheet_save', [unit, user, sheet, app, discription, data]);
    }
    async sheetTo(unit:number, user:number, sheetId:number, toArr:number[]) {
        await this.db.call('tv_$sheet_to', [unit, user, sheetId, toArr.join(',')]);
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
    async mySheets(sheet:string, state:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$sheet_state_my';
        return await this.db.call(sql, [unit, user, sheet, state, pageStart, pageSize]);
    }
    async getSheet(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv_$sheet_id';
        return await this.db.call(sql, [unit, user, sheet, id]);
    }

    async sheetScan(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv_$sheet_scan';
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
        let ret = await this.db.call('tv_' + query, [unit, user, ...params]);
        return ret;
    }

    // msgId: bus message id
    // body: bus message body
    async bus(bus:string, face:string, unit:number, faceId:number, msgId:number, body:string): Promise<void> {
        let sql = 'tv_' + bus + '_' + face;
        return await this.db.call(sql, [unit, 0, faceId, msgId, body]);
    }

    async importData(unit:number, user:number, source:string, entity:string, filePath: string): Promise<void> {
        await ImportData.exec(this, unit, this.db, source, entity, filePath);
    }

    async init() {
        if (this.schemas !== undefined) return;
        try {
            await this.initInternal();
        }
        catch (err) {
            this.schemas = {};
            console.error(err.message);
            debugger;
        }
    }

    private async initInternal() {
        let rows = await this.loadSchemas(false);
        let schemaTable:{id:number, name:string, type:number, version:number, schema:string, run:string, from:string}[] = rows[0];
        let settingTable:{name:string, value:string}[] = rows[1];
        let setting:{[name:string]:string|number} = {};
        for (let row of settingTable) {
            let v = row.value;
            let n = Number(v);
            setting[row.name] = isNaN(n)===true? v : n;
        }
        this.uqOwner = setting['uqOwner'] as string; 
        this.uq = setting['uq'] as string; 
        this.author = setting['author'] as string;
        this.version = setting['version'] as string;
        this.uqId = setting['uqId'] as number;
        
        console.log('init schemas: ', this.uq, this.author, this.version);

        this.schemas = {};
        this.accessSchemaArr = [];
        this.tuids = {};
        this.buses = {};
        this.entityColl = {};
        this.froms = {};
        this.sheetRuns = {};
        for (let row of schemaTable) {
            let {name, id, version, schema, run, from} = row;
            name = name.toLowerCase();
            let tuidFroms:{[tuid:string]:{tuid?:string, maps?:string[], tuidObj?:any, mapObjs?:{[map:string]:any}}};
            let schemaObj = JSON.parse(schema);
            let runObj = JSON.parse(run);
            schemaObj.typeId = id;
            schemaObj.version = version;
            let {type, url} = schemaObj;
            if (url !== undefined) url = url.toLowerCase();
            this.schemas[name] = {
                type: type,
                call: schemaObj,
                run: runObj,
            }
            switch (type) {
                case 'access':
                    this.accessSchemaArr.push(schemaObj); 
                    break;
                case 'bus':
                    this.buses[url] = schemaObj;
                    break;
                case 'tuid':
                    this.tuids[name] = schemaObj; 
                    if (from) {
                        tuidFroms = this.froms[from];
                        if (tuidFroms === undefined) tuidFroms = this.froms[from] = {};
                        let tuidFrom = tuidFroms[name];
                        if (tuidFrom === undefined) tuidFrom = tuidFroms[name] = {};
                        tuidFrom.tuidObj = schemaObj;
                    }
                    this.buildTuidMainFields(schemaObj);
                    break;
                case 'map':
                    if (from) {
                        tuidFroms = this.froms[from];
                        if (tuidFroms === undefined) tuidFroms = this.froms[from] = {};
                        let {keys} = schemaObj;
                        let key0 = keys[0];
                        let tuidName = key0.tuid;
                        if (tuidName === undefined) break;
                        let tuidFrom = tuidFroms[tuidName];
                        if (tuidFrom === undefined) tuidFrom = tuidFroms[tuidName] = {};
                        let mapObjs = tuidFrom.mapObjs;
                        if (mapObjs === undefined) mapObjs = tuidFrom.mapObjs = {};
                        mapObjs[name] = schemaObj;
                    }
                    break;
                case 'sheet':
                    this.sheetRuns[name] = {
                        onsave: runObj['$']!==undefined,
                        verify: schemaObj.verify,
                    };
                    break;
            }
            this.entityColl[id] = {
                name: name,
                access: type !== 'sheet'?
                    type + '|' + id :
                    {
                        $: type, 
                        id: id,
                        ops: schemaObj.states && schemaObj.states.map(v => v.name)
                    }
            };
        }
        for (let i in this.froms) {
            let from = this.froms[i];
            for (let t in from) {
                let syncTuid = from[t];
                let {tuidObj, mapObjs} = syncTuid;
                if (tuidObj !== undefined) {
                    syncTuid.tuid = (tuidObj.name as string).toLowerCase();
                }
                if (mapObjs !== undefined) {
                    let s:string[] = [];
                    for (let m in mapObjs) s.push(m.toLowerCase());
                    syncTuid.maps = s;
                }
            }
        }
        for (let i in this.schemas) {
            let schema = this.schemas[i].call;
            let {type, name} = schema;
            switch (type) {
                case 'map':
                    this.mapBorn(schema)
                    break;
            }
        }

        for (let i in this.schemas) {
            let schema = this.schemas[i];
            let {call} = schema;
            if (call === undefined) continue;
            let circular = false;
            let tuidsArr:any[] = [call];

            let text = JSON.stringify(call, (key:string, value:any) => {
                if (key === 'tuids') {
                    let ret:any[] = [];
                    for (let v of value) {
                        if (tuidsArr.findIndex(a => a === v) >= 0) {
                            circular = true;
                        }
                        else {
                            tuidsArr.push(v);
                            ret.push(v);
                        }
                    }
                    return ret.length > 0? ret : undefined;
                }
                else if (key !== '' && value === call) {
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

    private buildTuidMainFields(tuidSchema:any) {
        let {id, base, fields, main, arrs} = tuidSchema;
        let mainFields = tuidSchema.mainFields = [
            {name:id, type: 'id'}
        ];
        if (base) for (let b of base) mainFields.push(fields.find(v => v.name === b));
        if (main) for (let m of main) mainFields.push(fields.find(v => v.name === m));
        if (arrs === undefined) return;
        for (let arr of arrs) {
            let {id, owner, main, fields} = arr;
            mainFields = arr.mainFields = [
                {name:id, type: 'id'},
                {name:owner, type:'id'}
            ];
            if (main) for (let m of main) mainFields.push(fields.find(v => v.name === m));
        }
    }

    private mapBorn(schema:any) {
        function getCall(s:string) {
            let c = this.schemas[s];
            if (c === undefined) return;
            return c.call;
        }
        let call = getCall.bind(this);
        let {name, actions, queries} = schema;
        let sn = name.toLowerCase();
        for (let i in actions) {
            let n = sn + actions[i];
            schema.actions[i] = call(n);
        }
        for (let i in queries) {
            let n = sn + queries[i];
            schema.queries[i] = call(n);
        }
    }
    private buildAccesses() {
        this.access = {
            uq: this.uqId
        };
        for (let access of this.accessSchemaArr) {
            //let la = a.toLowerCase();
            //let schema = this.schemas[la];
            //if (schema === undefined) continue;
            //let access = schema.call;
            //if (access.type !== 'access') continue;
            let acc = this.access[access.name] = {};
            for (let item of access.list) {
                let it = item as string;
                let pos = it.indexOf(':');
                let name:string, ops:string;
                if (pos > 0) {
                    name = it.substring(0, pos);
                    ops = it.substring(pos+1);
                }
                else {
                    name = it;
                }
                let schema = this.schemas[name];
                if (schema === undefined) continue;
                let entity = schema.call;
                if (entity === undefined) continue;
                let {type, typeId} = entity;
                acc[name] = ops === undefined?
                    type + '|' + typeId :
                    {
                        $: type, 
                        id: typeId,
                        ops: ops.split('+')
                    };

            }
        }
        console.log('access: ', this.access);
    }
    private async getUserAccess(unit:number, user:number):Promise<number[]> {
        let result = await this.db.tablesFromProc('tv_$get_access', [unit, user]);
        let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
        return ret;
    }
    async getAccesses(unit:number, user:number, acc:string[]):Promise<any> {
        let reload:number = await this.getSetting(0, 'reloadSchemas');

        if (reload === 1) {
            this.schemas = undefined;
            await this.init();
            await this.setSetting(0, 'reloadSchemas', '0');
        }
        //await this.initSchemas();
        let access = {} as any;
        function merge(src:any) {
            for (let i in src) {
                let v = src[i];
                if (typeof v === 'string') {
                    access[i] = v;
                    continue;
                }
                let dst = access[i];
                if (dst === undefined) {
                    access[i] = v;
                    continue;
                }
                dst.ops = _.union(dst.ops, v.ops);
            }
        }
        if (acc === undefined) {
            for (let a in this.access) {
                merge(this.access[a]);
            }
        }
        else {
            for (let a of acc) merge(this.access[a]);
        }
        let accessEntities = await this.getUserAccess(unit, user);
        let entityAccess: {[name:string]: any} = {};
        for (let entityId of accessEntities) {
            let entity = this.entityColl[entityId];
            if (entity === undefined) continue;
            let {name, access} = entity;
            entityAccess[name] = access;
        }
        return {
            //access: access,
            access: entityAccess,
            tuids: this.tuids
        };
    }

    async getEntities(unit:number):Promise<any> {
        let reload:number = await this.getSetting(0, 'reloadSchemas');

        if (reload === 1) {
            this.schemas = undefined;
            await this.init();
            await this.setSetting(0, 'reloadSchemas', '0');
        }
        let entityAccess: {[name:string]: any} = {};
        for (let entityId in this.entityColl) {
            let entity = this.entityColl[entityId];
            let {name, access} = entity;
            entityAccess[name] = access;
        }
        return {
            access: entityAccess,
            tuids: this.tuids
        };
    }

    getSchema(name:string):any {
        return this.schemas[name.toLowerCase()];
    }
}
