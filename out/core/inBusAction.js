"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const packParam_1 = require("./packParam");
class ParametersBus {
    constructor(runner, entityName) {
        this.runner = runner;
        this.entityName = entityName;
    }
    init() {
        this.initSchema();
        this.initInBuses();
    }
    getQueryProc(bus, face) {
        return `${this.entityName}$bus$${bus}_${face}`;
    }
    initInBuses() {
        let { inBuses } = this.schema;
        if (inBuses === undefined)
            return;
        this.paramBuses = inBuses.map(v => {
            let parts = v.split('/');
            let schema = this.runner.getSchema(parts[0]);
            if (schema === undefined)
                return;
            let bus = schema.call;
            let { busOwner, busName } = bus;
            let face = parts[1];
            let { param, returns } = bus.schema[face];
            return {
                bus: bus,
                busOwner: busOwner,
                busName: busName,
                face: face,
                param: param,
                returns: returns,
            };
        });
    }
    buildData(unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.paramBuses === undefined)
                return data;
            let retBusQuery = [];
            for (let inBus of this.paramBuses) {
                let ret = yield this.busQuery(inBus, unit, user, data);
                retBusQuery.push(ret);
            }
            let ret = data + retBusQuery.join('\n\n') + '\n\n';
            return ret;
        });
    }
    buildDataFromObj(unit, user, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = packParam_1.packParam(this.schema, obj);
            return yield this.buildData(unit, user, data);
        });
    }
    busQuery(inBus, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let { bus, face, busOwner, busName, param, returns } = inBus;
            //let {busOwner, busName} = bus;
            let openApi = yield this.runner.net.openApiUnitFace(unit, busOwner, busName, face);
            if (openApi === undefined) {
                throw 'error await this.runner.net.openApiUnitFace nothing returned';
            }
            let params = [];
            let proc = this.getQueryProc(bus.name, face);
            let retParam = yield this.runner.tablesFromProc(proc, [unit, user, data]);
            let retParamMain = retParam[0][0];
            if (param !== undefined) {
                let retIndex = 1;
                for (let qp of param) {
                    let { name, type, fields } = qp;
                    let value;
                    if (type === 'array') {
                        value = this.buildTextFromRet(fields, retParam[retIndex++]);
                    }
                    else {
                        value = retParamMain[name];
                    }
                    params.push(value);
                }
            }
            let ret = yield openApi.busQuery(unit, busOwner, busName, face, params);
            let results = [];
            let { fields, arrs } = returns;
            let retMain = ret[0];
            let text = this.buildTextFromRet(fields, retMain);
            results.push(text);
            if (arrs !== undefined) {
                let len = arrs.length;
                for (let i = 0; i < len; i++) {
                    let text = this.buildTextFromRet(arrs[i].fields, ret[i + 1]);
                    results.push(text);
                }
            }
            return results.join('\n\n');
        });
    }
    buildTextFromRet(fields, values) {
        let ret = [];
        for (let row of values) {
            let items = [];
            for (let f of fields) {
                let fn = f.name;
                let v = row[fn];
                items.push(v);
            }
            ret.push(items.join('\t'));
        }
        return ret.join('\n');
    }
}
exports.ParametersBus = ParametersBus;
class ActionParametersBus extends ParametersBus {
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
    }
}
exports.ActionParametersBus = ActionParametersBus;
class AcceptParametersBus extends ParametersBus {
    constructor(runner, busName, faceName) {
        super(runner, busName);
        this.faceName = faceName;
    }
    getQueryProc(busName, face) {
        let ret = `${this.entityName}_${this.faceName}$bus$${busName}_${face}`;
        return ret;
    }
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.schema[this.faceName];
        let { accept } = this.schema;
        this.schema.inBuses = accept.inBuses;
    }
}
exports.AcceptParametersBus = AcceptParametersBus;
class SheetVerifyParametersBus extends ParametersBus {
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.verify;
    }
    getQueryProc(bus, face) { return `${this.entityName}$verify$bus$${bus}_${face}`; }
}
exports.SheetVerifyParametersBus = SheetVerifyParametersBus;
class SheetActionParametersBus extends ParametersBus {
    constructor(runner, sheetName, actionName) {
        super(runner, sheetName);
        this.actionName = actionName;
    }
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
    }
    getQueryProc(bus, face) { return `${this.entityName}_${this.actionName}$bus$${bus}_${face}`; }
}
exports.SheetActionParametersBus = SheetActionParametersBus;
//# sourceMappingURL=inBusAction.js.map