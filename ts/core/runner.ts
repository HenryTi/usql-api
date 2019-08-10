import * as _ from 'lodash';
import { Db, isDevelopment } from './db';
import { packReturns, packParam } from '.';
import { ImportData } from './importData';
import { InBusAction } from './inBusAction';
import { Net } from './net';

interface EntityAccess {
    name: string;
    access: any;
}

interface SheetRun {
    onsave: boolean;
    verify: any[];      // returns;
}

interface Buses {
    faces: string;
    outCount: number;
    coll: {[url:string]:Face}
    hasError: boolean;
}

interface Face {
    bus: string;
    faceName: string;
    version: number;
    accept?: boolean;
    query?: boolean;
}

export class Runner {
    protected db:Db;
    private access:any;
    private schemas: {[entity:string]: {type:string; from:string; call:any; run:any;}};
    private accessSchemaArr: any[];
    private tuids: {[name:string]: any};
    private busArr: any[];
    private setting: {[name:string]: any};
    private entityColl: {[id:number]: EntityAccess};
    private sheetRuns: {[sheet:string]: SheetRun};

    uqOwner: string;
    uq: string;
    author: string;
    version: string;
    importTuids:any[];
    // tuid的值，第一个是tuidname，随后用tab分隔的map
    froms: {[from:string]:{[tuid:string]:{tuid?:string, maps?:string[], tuidObj?:any, mapObjs?:{[map:string]:any}}}};
    hasUnit: boolean;
    uqId: number;
    uniqueUnit: number;
    buses:Buses; //{[url:string]:any}; // 直接查找bus
    hasSyncTuids: boolean = false;
    net: Net;

    constructor(db:Db, net:Net = undefined) {
        this.db = db;
        this.net = net;
        this.setting = {};
    }

    getDb():string {return this.db.getDbName()}

    async sql(sql:string, params:any[]): Promise<any> {
        try {
            return await this.db.sql(sql, params || []);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async log(unit:number, subject:string, content:string):Promise<void> {
        await this.db.log(unit, this.uq, subject, content);
    }
    async procCall(proc:string, params:any[]): Promise<any> {
        return await this.db.call(proc, params);
    }
    async call(proc:string, params:any[]): Promise<any> {
        return await this.db.call('tv_' + proc, params);
    }
    async buildDatabase(): Promise<boolean> {
        return await this.db.buildDatabase();
    }
    async createDatabase(): Promise<void> {
        return await this.db.createDatabase();
    }
    async existsDatabase(): Promise<boolean> {
        return await this.db.exists();
    }
    async tableFromProc(proc:string, params:any[]): Promise<any[]> {
        return await this.db.tableFromProc('tv_' + proc, params);
    }
    async tablesFromProc(proc:string, params:any[]): Promise<any[][]> {
        let ret = await this.db.tablesFromProc('tv_' + proc, params);
        let len = ret.length;
        if (len === 0) return ret;
        let pl = ret[len-1];
        if (Array.isArray(pl) === false) ret.pop();
        return ret;
    }
    async unitCall(proc:string, unit:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        return await this.db.call(proc, p);
    }
    async unitUserCall(proc:string, unit:number, user:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.call(proc, p);
    }

    private async unitCallEx(proc:string, unit:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        return await this.db.callEx(proc, p);
    }
    private async unitUserCallEx(proc:string, unit:number, user:number, ...params:any[]): Promise<any> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.callEx(proc, p);
    }

    async unitTableFromProc(proc:string, unit:number, ...params:any[]):Promise<any[]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc:string, unit:number, user:number, ...params:any[]):Promise<any[]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }

    async unitTablesFromProc(proc:string, unit:number, ...params:any[]):Promise<any[][]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc:string, unit:number, user:number, ...params:any[]):Promise<any[][]> {
        let p:any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }

    /*
    async $$openFresh(unit:number, stampsText:string) {
        return await this.unitCall('tv_$$open_fresh', unit, stampsText);
    }

    async setTimezone(unit:number, user:number): Promise<void> {
        return await this.unitUserCall('tv_$set_timezone', unit, user);
    }
    */

    async start(unit:number, user:number): Promise<void> {
        return await this.unitUserCall('tv_$start', unit, user);
    }
    async initResDb(resDbName:string): Promise<void> {
        await this.db.initResDb(resDbName);
    }
    async init$UqDb(): Promise<void> {
        await this.db.init$UqDb();
    }
    async initSetting():Promise<void> {
        await this.db.call('tv_$init_setting', []);
    }
    async setSetting(unit:number, name: string, value: string): Promise<void> {
        name = name.toLowerCase();
        await this.unitCall('tv_$set_setting', unit, name, value);
        if (unit === 0) {
            let n = Number(value);
            this.setting[name] = n === NaN? value : n;
        }
    }

    async getSetting(unit:number, name: string):Promise<any> {
        name = name.toLowerCase();
        let ret = await this.unitTableFromProc('tv_$get_setting', unit, name);
        if (ret.length===0) return undefined;
        let v = ret[0].value;
        if (unit === 0) {
            let n = Number(v);
            v = this.setting[name] = isNaN(n)===true? v : n;
        }
        return v;
    }

    async loadSchemas(hasSource:number): Promise<any[][]> {
        return await this.db.tablesFromProc('tv_$entitys', [hasSource]);
    }
    async saveSchema(unit:number, user:number, id:number, name:string, type:number, schema:string, run:string, source:string, from:string, open:number):Promise<any> {
        return await this.unitUserCall('tv_$entity', unit, user, id, name, type, schema, run, source, from, open);
    }
    async loadConstStrs(): Promise<{[name:string]:number}[]> {
        return await this.db.call('tv_$const_strs', []);
    }
    async saveConstStr(type:string): Promise<number> {
        return await this.db.call('tv_$const_str', [type]);
    }
    async loadSchemaVersion(name:string, version:string): Promise<string> {
        return await this.db.call('tv_$entity_version', [name, version]);
    } 
    async setEntityValid(entities:string, valid:number):Promise<any[]> {
        let ret = await this.db.call('tv_$entity_validate', [entities, valid]);
        return ret;
    }
    async saveFace(bus:string, busOwner:string, busName:string, faceName:string) {
        await this.db.call('tv_$save_face', [bus, busOwner, busName, faceName]);
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
        return await this.unitUserCallEx('tv_' + tuid, unit, user, id);
    }
    async tuidArrGet(tuid:string, arr:string, unit:number, user:number, owner:number, id:number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$id', unit, user, owner, id);
    }
    async tuidGetAll(tuid:string, unit:number, user:number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$all', unit, user);
    }
    async tuidVid(tuid:string, unit:number, uniqueValue:any): Promise<any> {
        let proc = `tv_${tuid}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidArrVid(tuid:string, arr:string, unit:number, uniqueValue:any): Promise<any> {
        let proc = `tv_${tuid}_${arr}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidGetArrAll(tuid:string, arr:string, unit:number, user:number, owner:number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$all', unit, user, owner);
    }
    async tuidProxyGet(tuid:string, unit:number, user:number, id:number, type:string): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$proxy', unit, user, id, type);
    }
    async tuidIds(tuid:string, arr:string, unit:number, user:number, ids:string): Promise<any> {
        let proc = 'tv_' + tuid;
        if (arr !== '$') proc += '_' + arr;
        proc += '$ids';
        let ret = await this.unitUserCall(proc, unit, user, ids);
        return ret;
    }
    async tuidMain(tuid:string, unit:number, user:number, id:number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$main', unit, user, id);
    }
    async tuidSave(tuid:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$save', unit, user, ...params);
    }
    async tuidSetStamp(tuid:string, unit:number, params:any[]): Promise<void> {
        return await this.unitCall('tv_' + tuid + '$stamp', unit, ...params);
    }
    async tuidArrSave(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$save', unit, user, ...params);
    }
    async tuidArrPos(tuid:string, arr:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$pos', unit, user, ...params);
    }
    async tuidSeach(tuid:string, unit:number, user:number, arr:string, key:string, pageStart:number, pageSize:number): Promise<any> {
        let proc = 'tv_' + tuid + '$search';
        return await this.unitUserTablesFromProc(proc, unit, user, key||'', pageStart, pageSize);
    }
    async tuidArrSeach(tuid:string, unit:number, user:number, arr:string, ownerId:number, key:string, pageStart:number, pageSize:number): Promise<any> {
        let proc = `tv_${tuid}_${arr}$search`;
        return await this.unitUserTablesFromProc(proc, unit, user, ownerId, key||'', pageStart, pageSize);
    }
    async mapSave(map:string, unit:number, user:number, params:any[]): Promise<any> {
        return await this.unitUserCall('tv_' + map + '$save', unit, user, ...params);
    }
    async importVId(unit:number, user:number, source:string, tuid:string, arr:string, no:string): Promise<number> {
        let proc = `tv_$import_vid`;
        let ret = await this.unitUserTableFromProc(proc, unit, user, source, tuid, arr, no);
        return ret[0].vid;
    }
    async sheetVerify(sheet:string, unit:number, user:number, data:string):Promise<string> {
        let sheetRun = this.sheetRuns[sheet];
        if (sheetRun === undefined) return;
        let {verify} = sheetRun;
        if (verify === undefined) return;
        let actionName = sheet + '$verify';
        let inBusAction = this.getInBusAction(actionName);
        let inBusActionData = inBusAction.buildData(unit, user, data);
        let ret = await this.unitUserCall('tv_' + actionName, unit, user, inBusActionData);
        let {length} = verify;
        if (length === 0) {
            if (ret === undefined) return 'fail';
            return;
        }
        if (length === 1) ret = [ret];
        for (let i=0; i<length; i++) {
            let t = ret[i];
            if (t.length > 0) {
                return packReturns(verify, ret);
            }
        }
        return;
    }
    async sheetSave(sheet:string, unit:number, user:number, app:number, discription:string, data:string): Promise<{}> {
        return await this.unitUserCall('tv_$sheet_save', unit, user, sheet, app, discription, data);
    }
    async sheetTo(unit:number, user:number, sheetId:number, toArr:number[]) {
        await this.unitUserCall('tv_$sheet_to', unit, user, sheetId, toArr.join(','));
    }
    async sheetProcessing(sheetId:number):Promise<void> {
        await this.db.call('tv_$sheet_processing', [sheetId]);
    }
    async sheetAct(sheet:string, state:string, action:string, unit:number, user:number, id:number, flow:number): Promise<any[]> {
        let inBusActionName = sheet + '_' + (state === '$'?  action : state + '_' + action);
        let inBusAction = this.getInBusAction(inBusActionName);        
        let inBusActionData = inBusAction.buildData(unit, user, action);
        return await this.unitUserCallEx('tv_' + inBusActionName, unit, user, id, flow, inBusActionData);
    }
    async sheetStates(sheet:string, state:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$sheet_state';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async sheetStateCount(sheet:string, unit:number, user:number) {
        let sql = 'tv_$sheet_state_count';
        return await this.unitUserCall(sql, unit, user, sheet);
    }
    async mySheets(sheet:string, state:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$sheet_state_my';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async getSheet(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv_$sheet_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetScan(sheet:string, unit:number, user:number, id:number) {
        let sql = 'tv_$sheet_scan';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetArchives(sheet:string, unit:number, user:number, pageStart:number, pageSize:number) {
        let sql = 'tv_$archives';
        return await this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
    }

    async sheetArchive(unit:number, user:number, sheet:string, id:number) {
        let sql = 'tv_$archive_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    private inBusActions:{[actionName:string]:InBusAction} = {}
    private getInBusAction(actionName:string):InBusAction {
        let inBusAction = this.inBusActions[actionName];
        if (inBusAction !== undefined) return inBusAction;
        inBusAction = new InBusAction(actionName, this);
        return this.inBusActions[actionName] = inBusAction;
    }
    async action(actionName:string, unit:number, user:number, data:string): Promise<any[][]> {
        let inBusAction = this.getInBusAction(actionName);
        let actionData = await inBusAction.buildData(unit, user, data);
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
        return result;
    }

    async actionFromObj(actionName:string, unit:number, user:number, obj:any): Promise<any[][]> {
        let inBusAction = this.getInBusAction(actionName);
        let actionData = await inBusAction.buildDataFromObj(unit, user, obj);
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
        return result;
    }

    async query(query:string, unit:number, user:number, params:any[]): Promise<any> {
        let ret = await this.unitUserCall('tv_' + query, unit, user, ...params);
        return ret;
    }

    // msgId: bus message id
    // body: bus message body
    async bus(bus:string, face:string, unit:number, msgId:number, body:string): Promise<void> {
        let actionName = bus + '_' + face;
        let inBusAction = this.getInBusAction(actionName);
        let data = await inBusAction.buildData(unit, 0, body);
        return await this.unitUserCall('tv_' + actionName, unit, 0, msgId, data);
    }

    async busSyncMax(unit:number, maxId:number): Promise<void> {
        return await this.call('$sync_busmax', [unit, maxId]);
    }

    async importData(unit:number, user:number, source:string, entity:string, filePath: string): Promise<void> {
        await ImportData.exec(this, unit, this.db, source, entity, filePath);
    }

    async reset() {
        if (this.buses) this.buses.hasError = false;
        this.schemas = undefined;
    }

    async init() {
        if (this.schemas !== undefined) return;
        try {
            await this.initInternal();
        }
        catch (err) {
            this.schemas = undefined;
            console.error(err.message);
            debugger;
        }
    }

    private async initInternal() {
        let rows = await this.loadSchemas(0);
        let schemaTable:{id:number, name:string, type:number, version:number, schema:string, run:string, from:string}[] = rows[0];
        let settingTable:{name:string, value:string}[] = rows[1];
        let setting:{[name:string]:string|number} = {};
        for (let row of settingTable) {
            let v = row.value;
            if (v === null) {
                setting[row.name] = null;
            }
            else {
                let n = Number(v);
                setting[row.name] = isNaN(n)===true? v : n;
            }
        }
        this.uqOwner = setting['uqOwner'] as string; 
        this.uq = setting['uq'] as string; 
        this.author = setting['author'] as string;
        this.version = setting['version'] as string;
        this.uqId = setting['uqId'] as number;
        this.hasUnit = !(setting['hasUnit'] as number === 0);

        let uu = setting['uniqueUnit'];
        this.uniqueUnit = uu? uu as number: 0;
        
        if (isDevelopment) console.log('init schemas: ', this.uq, this.author, this.version);

        this.schemas = {};
        this.accessSchemaArr = [];
        this.tuids = {};
        this.busArr = [];
        this.entityColl = {};
        this.froms = {};
        this.sheetRuns = {};
        for (let row of schemaTable) {
            let {name, id, version, schema, run, from} = row;
            if (!schema) continue;
            name = name.toLowerCase();
            let tuidFroms:{[tuid:string]:{tuid?:string, maps?:string[], tuidObj?:any, mapObjs?:{[map:string]:any}}};
            let schemaObj = JSON.parse(schema);
            let runObj = JSON.parse(run);
            schemaObj.typeId = id;
            schemaObj.version = version;
            let {type, sync} = schemaObj;
            //if (url !== undefined) url = url.toLowerCase();
            this.schemas[name] = {
                type: type,
                from: from,
                call: schemaObj,
                run: runObj,
            }
            switch (type) {
                case 'access':
                    this.accessSchemaArr.push(schemaObj); 
                    break;
                case 'bus':
                    this.busArr.push(schemaObj);
                    break;
                case 'tuid':
                    this.tuids[name] = schemaObj; 
                    if (from) {
                        if (!(sync === false)) this.hasSyncTuids = true;
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

        let faces:string[] = [];
        let outCount = 0;
        let coll:{[url:string]:Face} = {};
        for (let busSchema of this.busArr) {
            let {name:bus, busOwner, busName, schema} = busSchema;
            let hasAccept:boolean = false;
            for (let i in schema) {
                let {version, accept, query} = schema[i];
                let faceName = i.toLowerCase();
                let url = busOwner.toLowerCase() + '/' + busName.toLowerCase() + '/' + faceName;
                if (coll[url]) continue;
                if (accept === true) {
                    faces.push(url);
                    coll[url] = {
                        bus: bus,
                        faceName: faceName,
                        version: version,
                        accept: true,
                    };
                    hasAccept = true;
                }
                else if (query === true) {
                    coll[url] = {
                        bus: bus,
                        faceName: faceName,
                        version: version,
                        query: true,
                    };
                }
            }
            if (hasAccept === false) ++outCount;
        }
        let faceText:string;
        if (faces.length > 0) faceText = faces.join('\n');
        //if (faceText !== undefined && outCount > 0) {
        this.buses = {
            faces: faceText, 
            outCount: outCount,
            coll: coll,
            hasError: false,
        };
        //}

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
        if (isDevelopment) console.log('access: ', this.access);
    }
    private async getUserAccess(unit:number, user:number):Promise<number[]> {
        let result = await this.db.tablesFromProc('tv_$get_access', [unit]);
        let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
        return ret;
    }
    async getAccesses(unit:number, user:number, acc:string[]):Promise<any> {
        await this.init();
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
        await this.init();
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
