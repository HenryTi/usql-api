"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const db_1 = require("../db");
const __1 = require("..");
const importData_1 = require("../importData");
const inBusAction_1 = require("../inBusAction");
const centerApi_1 = require("../centerApi");
class EntityRunner {
    constructor(name, db, net = undefined) {
        this.roleVersions = {};
        this.hasPullEntities = false;
        this.hasSheet = false;
        this.isCompiling = false;
        this.parametersBusCache = {};
        this.actionConvertSchemas = {};
        this.name = name;
        this.db = db;
        this.net = net;
        //this.setting = {};
        this.modifyMaxes = {};
    }
    getDb() { return this.db.getDbName(); }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isCompiling = false;
            this.db.reset();
            this.schemas = undefined;
            yield this.init();
        });
    }
    getRoles(unit, app, user, inRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            let [rolesBin, rolesVersion] = inRoles.split('.');
            let unitRVs = this.roleVersions[unit];
            if (unitRVs === undefined) {
                this.roleVersions[unit] = unitRVs = {};
            }
            let rv = unitRVs[app];
            if (rv !== undefined) {
                let { version: rvVersion, tick } = rv;
                let now = Date.now();
                if (Number(rolesVersion) === rvVersion && now - tick < 60 * 1000)
                    return;
            }
            // 去中心服务器取user对应的roles，version
            let ret = yield centerApi_1.centerApi.appRoles(unit, app, user);
            if (ret === undefined)
                return;
            let { roles, version } = ret;
            unitRVs[app] = { version, tick: Date.now() };
            if (version === Number(rolesVersion) && roles === Number(rolesBin))
                return;
            return ret;
        });
    }
    checkUqVersion(uqVersion) {
        //if (this.uqVersion === undefined) return;
        //if (uqVersion !== this.uqVersion) 
        throw 'unmatched uq version';
    }
    setModifyMax(unit, modifyMax) {
        this.modifyMaxes[unit] = modifyMax;
    }
    getModifyMax(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = this.modifyMaxes[unit];
            if (ret !== undefined) {
                if (ret === null)
                    return;
                return ret;
            }
            try {
                let maxes = yield this.tableFromProc('$modify_queue_max', [unit]);
                ret = maxes[0].max;
                this.modifyMaxes[unit] = ret;
                return ret;
            }
            catch (err) {
                console.error(err);
                this.modifyMaxes[unit] = null;
            }
        });
    }
    /*
    private async sql(sql:string, params:any[]): Promise<any> {
        try {
            return await this.db.sql(sql, params || []);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    private async procSql(procName:string, procSql:string): Promise<any> {
        try {
            return await this.db.sqlProc(procName, procSql);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    private async procCoreSql(procName:string, procSql:string): Promise<any> {
        try {
            //let sqlDrop = 'DROP PROCEDURE IF EXISTS ' + procName;
            //await this.db.sql(sqlDrop, undefined);
            await this.db.sqlDropProc(procName);
            return await this.db.sql(procSql, undefined);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    */
    log(unit, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.log(unit, this.net.getUqFullName(this.uq), subject, content);
        });
    }
    procCall(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call(proc, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_' + proc, params);
        });
    }
    /*
    private async buildDatabase(): Promise<boolean> {
        return await this.db.buildDatabase();
    }
    
    async createDatabase(): Promise<void> {
        return await this.db.createDatabase();
    }
    async existsDatabase(): Promise<boolean> {
        return await this.db.exists();
    }
    */
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.buildTuidAutoId();
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tableFromProc('tv_' + proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tablesFromProc('tv_' + proc, params);
            let len = ret.length;
            if (len === 0)
                return ret;
            let pl = ret[len - 1];
            if (Array.isArray(pl) === false)
                ret.pop();
            return ret;
        });
    }
    unitCall(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCall(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCallEx(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.callEx(proc, p);
        });
    }
    unitTableFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitUserTableFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitTablesFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    unitUserTablesFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    start(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_$start', unit, user);
        });
    }
    createResDb(resDbName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.createResDb(resDbName);
        });
    }
    create$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.create$UqDb();
        });
    }
    /*
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
    */
    loadSchemas(hasSource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tablesFromProc('tv_$entitys', [hasSource]);
        });
    }
    saveSchema(unit, user, id, name, type, schema, run, source, from, open) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_$entity', unit, user, id, name, type, schema, run, source, from, open);
        });
    }
    loadConstStrs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$const_strs', []);
        });
    }
    saveConstStr(type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$const_str', [type]);
        });
    }
    loadSchemaVersion(name, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('tv_$entity_version', [name, version]);
        });
    }
    setEntityValid(entities, valid) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.call('tv_$entity_validate', [entities, valid]);
            return ret;
        });
    }
    saveFace(bus, busOwner, busName, faceName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$save_face', [bus, busOwner, busName, faceName]);
        });
    }
    tagType(names) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$tag_type', [names]);
        });
    }
    tagSaveSys(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$tag_save_sys', [data]);
        });
    }
    isTuidOpen(tuid) {
        tuid = tuid.toLowerCase();
        let t = this.tuids[tuid];
        if (t === undefined)
            return false;
        if (t.isOpen === true)
            return true;
        return false;
    }
    getTuid(tuid) {
        tuid = tuid.toLowerCase();
        let ret = this.tuids[tuid];
        return ret;
    }
    getMap(map) {
        map = map.toLowerCase();
        let m = this.schemas[map];
        if (m === undefined)
            return;
        if (m.type === 'map')
            return m;
    }
    entityNo(entity, unit, year, month, date) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.call('$entity_no', [unit, entity, `${year}-${month}-${date}`]);
        });
    }
    tuidGet(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCallEx('tv_' + tuid, unit, user, id);
        });
    }
    tuidArrGet(tuid, arr, unit, user, owner, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '_' + arr + '$id', unit, user, owner, id);
        });
    }
    tuidGetAll(tuid, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '$all', unit, user);
        });
    }
    tuidVid(tuid, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}$vid`;
            return yield this.unitCall(proc, unit, uniqueValue);
        });
    }
    tuidArrVid(tuid, arr, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}_${arr}$vid`;
            return yield this.unitCall(proc, unit, uniqueValue);
        });
    }
    tuidGetArrAll(tuid, arr, unit, user, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '_' + arr + '$all', unit, user, owner);
        });
    }
    tuidIds(tuid, arr, unit, user, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = 'tv_' + tuid;
            if (arr !== '$')
                proc += '_' + arr;
            proc += '$ids';
            let ret = yield this.unitUserCall(proc, unit, user, ids);
            return ret;
        });
    }
    tuidMain(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '$main', unit, user, id);
        });
    }
    tuidSave(tuid, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '$save', unit, user, ...params);
        });
    }
    tuidSetStamp(tuid, unit, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitCall('tv_' + tuid + '$stamp', unit, ...params);
        });
    }
    tuidArrSave(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '_' + arr + '$save', unit, user, ...params);
        });
    }
    tuidArrPos(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + tuid + '_' + arr + '$pos', unit, user, ...params);
        });
    }
    tuidSeach(tuid, unit, user, arr, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = 'tv_' + tuid + '$search';
            return yield this.unitUserTablesFromProc(proc, unit, user, key || '', pageStart, pageSize);
        });
    }
    saveProp(tuid, unit, user, id, prop, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = 'tv_' + tuid + '$prop_' + prop;
            yield this.unitUserCall(proc, unit, user, id, prop, value);
        });
    }
    tuidArrSeach(tuid, unit, user, arr, ownerId, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_${tuid}_${arr}$search`;
            return yield this.unitUserTablesFromProc(proc, unit, user, ownerId, key || '', pageStart, pageSize);
        });
    }
    mapSave(map, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_' + map + '$save', unit, user, ...params);
        });
    }
    importVId(unit, user, source, tuid, arr, no) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `tv_$import_vid`;
            let ret = yield this.unitUserTableFromProc(proc, unit, user, source, tuid, arr, no);
            return ret[0].vid;
        });
    }
    getSheetVerifyParametersBus(sheetName) {
        let name = sheetName + '$verify';
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let svpb = new inBusAction_1.SheetVerifyParametersBus(this, sheetName);
            if (svpb.init() === true) {
                inBusAction = this.parametersBusCache[name];
            }
        }
        return inBusAction;
    }
    sheetVerify(sheet, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let sheetRun = this.sheetRuns[sheet];
            if (sheetRun === undefined)
                return;
            let { verify } = sheetRun;
            if (verify === undefined)
                return;
            //let actionName = sheet + '$verify';
            let inBusAction = this.getSheetVerifyParametersBus(sheet);
            let inBusResult = yield inBusAction.buildData(unit, user, data);
            let inBusActionData = data + inBusResult;
            let ret = yield this.unitUserCall('tv_' + sheet + '$verify', unit, user, inBusActionData);
            let { returns } = verify;
            let { length } = returns;
            if (length === 0) {
                if (ret === undefined || ret.length === 0)
                    return 'fail';
                return;
            }
            if (length === 1)
                ret = [ret];
            for (let i = 0; i < length; i++) {
                let t = ret[i];
                if (t.length > 0) {
                    return __1.packReturns(returns, ret);
                }
            }
            return;
        });
    }
    sheetSave(sheet, unit, user, app, discription, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('tv_$sheet_save', unit, user, sheet, app, discription, data);
        });
    }
    sheetTo(unit, user, sheetId, toArr) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unitUserCall('tv_$sheet_to', unit, user, sheetId, toArr.join(','));
        });
    }
    sheetProcessing(sheetId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('tv_$sheet_processing', [sheetId]);
        });
    }
    getSheetActionParametersBus(sheetName, stateName, actionName) {
        let name = `${sheetName}_${stateName}_${actionName}`;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let sapb = new inBusAction_1.SheetActionParametersBus(this, sheetName, stateName, actionName);
            if (sapb.init() === true) {
                inBusAction = this.parametersBusCache[name] = sapb;
            }
        }
        return inBusAction;
    }
    sheetAct(sheet, state, action, unit, user, id, flow) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusActionName = sheet + '_' + (state === '$' ? action : state + '_' + action);
            let inBusAction = this.getSheetActionParametersBus(sheet, state, action);
            if (inBusAction === undefined)
                return;
            let inBusActionData = yield inBusAction.buildData(unit, user, id);
            //await this.log(unit, 'sheetAct', 'before ' + inBusActionName);
            let ret = inBusActionData === '' ?
                yield this.unitUserCallEx('tv_' + inBusActionName, unit, user, id, flow, action)
                : yield this.unitUserCallEx('tv_' + inBusActionName, unit, user, id, flow, action, inBusActionData);
            //await this.log(unit, 'sheetAct', 'after ' + inBusActionName);
            return ret;
        });
    }
    sheetStates(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state';
            return yield this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
        });
    }
    sheetStateCount(sheet, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state_count';
            return yield this.unitUserCall(sql, unit, user, sheet);
        });
    }
    userSheets(sheet, state, unit, user, sheetUser, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state_user';
            return yield this.unitUserCall(sql, unit, user, sheet, state, sheetUser, pageStart, pageSize);
        });
    }
    mySheets(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_state_my';
            return yield this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
        });
    }
    getSheet(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_id';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    sheetScan(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$sheet_scan';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    sheetArchives(sheet, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$archives';
            return yield this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
        });
    }
    sheetArchive(unit, user, sheet, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = 'tv_$archive_id';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    getActionParametersBus(actionName) {
        let inBusAction = this.parametersBusCache[actionName];
        if (inBusAction === undefined) {
            let apb = new inBusAction_1.ActionParametersBus(this, actionName);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[actionName] = apb;
            }
        }
        return inBusAction;
    }
    action(actionName, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getActionParametersBus(actionName);
            let inBusResult = yield inBusAction.buildData(unit, user, data);
            let actionData = data + inBusResult;
            let result = yield this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
            return result;
        });
    }
    actionFromObj(actionName, unit, user, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getActionParametersBus(actionName);
            let actionData = yield inBusAction.buildDataFromObj(unit, user, obj);
            let result = yield this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
            return result;
        });
    }
    actionDirect(actionName, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.unitUserCallEx('tv_' + actionName, unit, user, ...params);
            return result;
        });
    }
    query(query, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.unitUserCall('tv_' + query, unit, user, ...params);
            return ret;
        });
    }
    // msgId: bus message id
    // body: bus message body
    getAcceptParametersBus(bus, face) {
        let name = bus + '_' + face;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction == undefined) {
            let apb = new inBusAction_1.AcceptParametersBus(this, bus, face);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[name] = apb;
            }
        }
        return inBusAction;
    }
    bus(bus, face, unit, msgId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getAcceptParametersBus(bus, face);
            let inBusResult = yield inBusAction.buildData(unit, 0, body);
            let data = body + inBusResult;
            yield this.unitUserCall('tv_' + bus + '_' + face, unit, 0, msgId, data);
        });
    }
    checkPull(unit, entity, entityType, modifies) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc;
            switch (entityType) {
                default: throw 'error entityType';
                case 'tuid':
                    proc = `tv_${entity}$pull_check`;
                    break;
                case 'map':
                    proc = 'tv_$map_pull_check';
                    break;
            }
            return yield this.unitTableFromProc(proc, unit, entity, modifies);
        });
    }
    importData(unit, user, source, entity, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield importData_1.ImportData.exec(this, unit, this.db, source, entity, filePath);
        });
    }
    equDb(db) {
        return this.db === db;
    }
    /*
        async reset() {
            await this.net.resetRunnerAfterCompile(this);
        }
    */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            try {
                yield this.initInternal();
            }
            catch (err) {
                this.schemas = undefined;
                console.error(err.message);
                debugger;
            }
        });
    }
    initInternal() {
        return __awaiter(this, void 0, void 0, function* () {
            let rows = yield this.loadSchemas(0);
            let schemaTable = rows[0];
            let settingTable = rows[1];
            let setting = {};
            for (let row of settingTable) {
                let { name, value } = row;
                name = name.toLowerCase();
                if (value === null) {
                    setting[name] = null;
                }
                else {
                    let n = Number(value);
                    setting[name] = isNaN(n) === true ? value : n;
                }
            }
            this.uqOwner = setting['uqowner'];
            this.uq = setting['uq'];
            this.author = setting['author'];
            this.uqId = setting['uqid'];
            this.version = setting['version']; // source verion in uq code
            this.uqVersion = setting['uqversion']; // compile changed
            if (this.uqVersion === undefined)
                this.uqVersion = 1;
            this.hasUnit = !(setting['hasunit'] === 0);
            let uu = setting['uniqueunit'];
            this.uniqueUnit = uu ? uu : 0;
            if (db_1.isDevelopment)
                console.log('init schemas: ', this.uq, this.author, this.version);
            this.schemas = {};
            this.accessSchemaArr = [];
            this.tuids = {};
            this.busArr = [];
            this.entityColl = {};
            this.froms = {};
            this.sheetRuns = {};
            for (let row of schemaTable) {
                let { name, id, version, schema, run, from } = row;
                if (!schema)
                    continue;
                //name = name.toLowerCase();
                let tuidFroms;
                let schemaObj = JSON.parse(schema);
                let sName = schemaObj.name;
                let runObj = JSON.parse(run);
                schemaObj.typeId = id;
                schemaObj.version = version;
                let { type, sync } = schemaObj;
                //if (url !== undefined) url = url.toLowerCase();
                this.schemas[name] = {
                    type: type,
                    from: from,
                    call: schemaObj,
                    run: runObj,
                };
                switch (type) {
                    case '$role':
                        this.role = schemaObj;
                        break;
                    case 'access':
                        this.accessSchemaArr.push(schemaObj);
                        break;
                    case 'bus':
                        this.busArr.push(schemaObj);
                        break;
                    case 'tuid':
                        this.tuids[name] = schemaObj;
                        if (from) {
                            if (!(sync === false))
                                this.hasPullEntities = true;
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let tuidFrom = tuidFroms[name];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[name] = {};
                            tuidFrom.tuidObj = schemaObj;
                        }
                        this.buildTuidMainFields(schemaObj);
                        break;
                    case 'map':
                        if (from) {
                            this.hasPullEntities = true;
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let { keys } = schemaObj;
                            let key0 = keys[0];
                            let tuidName = key0.tuid;
                            if (tuidName === undefined)
                                break;
                            let tuidFrom = tuidFroms[tuidName];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[tuidName] = {};
                            let mapObjs = tuidFrom.mapObjs;
                            if (mapObjs === undefined)
                                mapObjs = tuidFrom.mapObjs = {};
                            mapObjs[name] = schemaObj;
                        }
                        break;
                    case 'sheet':
                        this.hasSheet = true;
                        this.sheetRuns[name] = {
                            onsave: runObj['$'] !== undefined,
                            verify: schemaObj.verify,
                        };
                        break;
                }
                this.entityColl[id] = {
                    name: sName,
                    access: type !== 'sheet' ?
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
                    let { tuidObj, mapObjs } = syncTuid;
                    if (tuidObj !== undefined) {
                        syncTuid.tuid = tuidObj.name.toLowerCase();
                    }
                    if (mapObjs !== undefined) {
                        let s = [];
                        for (let m in mapObjs)
                            s.push(m.toLowerCase());
                        syncTuid.maps = s;
                    }
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i].call;
                let { type, name } = schema;
                switch (type) {
                    case 'map':
                        this.mapBorn(schema);
                        break;
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i];
                let { call } = schema;
                if (call === undefined)
                    continue;
                let circular = false;
                let tuidsArr = [call];
                let text = JSON.stringify(call, (key, value) => {
                    if (key === 'tuids') {
                        let ret = [];
                        for (let v of value) {
                            if (tuidsArr.findIndex(a => a === v) >= 0) {
                                circular = true;
                            }
                            else {
                                tuidsArr.push(v);
                                ret.push(v);
                            }
                        }
                        return ret.length > 0 ? ret : undefined;
                    }
                    else if (key !== '' && value === call) {
                        circular = true;
                        return undefined;
                    }
                    else
                        return value;
                });
                if (circular) {
                    let newCall = JSON.parse(text);
                    schema.call = newCall;
                }
            }
            let faces = [];
            let outCount = 0;
            let coll = {};
            for (let busSchema of this.busArr) {
                let { name: bus, busOwner, busName, schema } = busSchema;
                let hasAccept = false;
                for (let i in schema) {
                    let { version, accept, query } = schema[i];
                    let faceName = i.toLowerCase();
                    let url = busOwner.toLowerCase() + '/' + busName.toLowerCase() + '/' + faceName;
                    if (coll[url])
                        continue;
                    if (accept !== undefined) {
                        faces.push(url);
                        coll[url] = {
                            bus: bus,
                            faceName: faceName,
                            version: version,
                            accept: accept,
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
                if (hasAccept === false)
                    ++outCount;
            }
            let faceText;
            if (faces.length > 0)
                faceText = faces.join('\n');
            this.buses = {
                faces: faceText,
                outCount: outCount,
                coll: coll,
                hasError: false,
            };
            this.buildAccesses();
        });
    }
    buildTuidMainFields(tuidSchema) {
        let { id, base, fields, main, arrs } = tuidSchema;
        let mainFields = tuidSchema.mainFields = [
            { name: id, type: 'id' }
        ];
        if (base)
            for (let b of base)
                mainFields.push(fields.find(v => v.name === b));
        if (main)
            for (let m of main)
                mainFields.push(fields.find(v => v.name === m));
        if (arrs === undefined)
            return;
        for (let arr of arrs) {
            let { id, owner, main, fields } = arr;
            mainFields = arr.mainFields = [
                { name: id, type: 'id' },
                { name: owner, type: 'id' }
            ];
            if (main)
                for (let m of main)
                    mainFields.push(fields.find(v => v.name === m));
        }
    }
    mapBorn(schema) {
        function getCall(s) {
            let c = this.schemas[s];
            if (c === undefined)
                return;
            return c.call;
        }
        let call = getCall.bind(this);
        let { name, actions, queries } = schema;
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
    buildAccesses() {
        this.access = {
            uq: this.uqId
        };
        for (let access of this.accessSchemaArr) {
            let acc = this.access[access.name] = {};
            for (let item of access.list) {
                let it = item;
                let pos = it.indexOf(':');
                let name, ops;
                if (pos > 0) {
                    name = it.substring(0, pos);
                    ops = it.substring(pos + 1);
                }
                else {
                    name = it;
                }
                let schema = this.schemas[name];
                if (schema === undefined)
                    continue;
                let entity = schema.call;
                if (entity === undefined)
                    continue;
                let { type, typeId } = entity;
                acc[name] = ops === undefined ?
                    type + '|' + typeId :
                    {
                        $: type,
                        id: typeId,
                        ops: ops.split('+')
                    };
            }
        }
        if (db_1.isDevelopment)
            console.log('access: ', this.access);
    }
    getUserAccess(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.db.tablesFromProc('tv_$get_access', [unit]);
            let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
            return ret;
        });
    }
    getAccesses(unit, user, acc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            let access = {};
            function merge(src) {
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
                for (let a of acc)
                    merge(this.access[a]);
            }
            let accessEntities = yield this.getUserAccess(unit, user);
            let entityAccess = {};
            for (let entityId of accessEntities) {
                let entity = this.entityColl[entityId];
                if (entity === undefined)
                    continue;
                let { name, access } = entity;
                entityAccess[name] = access;
            }
            return {
                version: this.uqVersion,
                access: entityAccess,
                tuids: this.tuids,
                role: this.role,
            };
        });
    }
    getEntities(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            let entityAccess = {};
            for (let entityId in this.entityColl) {
                let entity = this.entityColl[entityId];
                let { name, access } = entity;
                entityAccess[name] = access;
            }
            return {
                version: this.uqVersion,
                access: entityAccess,
                tuids: this.tuids,
                role: this.role,
            };
        });
    }
    getSchema(name) {
        return this.schemas[name.toLowerCase()];
    }
    tagValues(unit, type) {
        return __awaiter(this, void 0, void 0, function* () {
            type = type.toLowerCase();
            let schema = this.schemas[type];
            if (schema === undefined)
                return;
            let { call } = schema;
            let isSys = call.hasValue === true ? 1 : 0;
            let result = yield this.db.tableFromProc('tv_$tag_values', [unit, isSys, type]);
            let ret = '';
            for (let row of result) {
                let { id, name, ext } = row;
                if (ext === null)
                    ext = '';
                if (ret.length > 0)
                    ret += '\n';
                ret += `${id}\t${name}\t${ext}`;
            }
            return ret;
        });
    }
    getActionConvertSchema(name) {
        return this.actionConvertSchemas[name];
    }
    setActionConvertSchema(name, value) {
        this.actionConvertSchemas[name] = value;
    }
}
exports.EntityRunner = EntityRunner;
//# sourceMappingURL=entityRunner.js.map