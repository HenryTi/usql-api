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
exports.SheetActionParametersBus = exports.SheetVerifyParametersBus = exports.AcceptParametersBus = exports.ActionParametersBus = exports.ParametersBus = void 0;
const packParam_1 = require("./packParam");
class ParametersBus {
    constructor(runner, entityName) {
        this.runner = runner;
        this.entityName = entityName;
    }
    init() {
        let ret = this.initSchema();
        this.initInBuses();
        return ret;
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
                return '';
            let retBusQuery = [];
            for (let inBus of this.paramBuses) {
                let ret = yield this.busQuery(inBus, unit, user, data);
                retBusQuery.push(ret);
            }
            let ret = retBusQuery.join('\n\n') + '\n\n';
            return ret;
        });
    }
    buildDataFromObj(unit, user, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = packParam_1.packParam(this.schema, obj);
            let ret = yield this.buildData(unit, user, data);
            return data + ret;
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
                        value = retParamMain[name] || retParamMain[name.toLowerCase()];
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
        return true;
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
        return true;
    }
}
exports.AcceptParametersBus = AcceptParametersBus;
class SheetVerifyParametersBus extends ParametersBus {
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call.verify;
        return true;
    }
    getQueryProc(bus, face) { return `${this.entityName}$verify$bus$${bus}_${face}`; }
}
exports.SheetVerifyParametersBus = SheetVerifyParametersBus;
class SheetActionParametersBus extends ParametersBus {
    constructor(runner, sheetName, stateName, actionName) {
        super(runner, sheetName);
        this.stateName = stateName.toLowerCase();
        this.actionName = actionName.toLowerCase();
    }
    initSchema() {
        let schema = this.runner.getSchema(this.entityName);
        this.schema = schema.call;
        let state = this.schema.states.find(v => v.name === this.stateName);
        if (state === undefined) {
            console.error('Sheet %s 没有定义 State %s', this.entityName, this.stateName);
            return false;
        }
        let action = state.actions.find(v => v.name === this.actionName);
        if (action === undefined) {
            console.error('Sheet %s State %s 没有定义 Action %s', this.entityName, this.stateName, this.actionName);
            return false;
        }
        this.schema.inBuses = action.inBuses;
        return true;
    }
    getQueryProc(bus, face) {
        let ret = this.entityName + '_';
        if (this.stateName !== '$')
            ret += this.stateName + '_';
        return ret + `${this.actionName}$bus$${bus}_${face}`;
    }
}
exports.SheetActionParametersBus = SheetActionParametersBus;
//# sourceMappingURL=inBusAction.js.map