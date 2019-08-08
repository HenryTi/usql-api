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
class InBusAction {
    constructor(action, runner) {
        this.action = action;
        this.runner = runner;
        let schema = this.runner.getSchema(action);
        this.schema = schema.call;
        this.initInBuses();
    }
    initInBuses() {
        let { inBuses } = this.schema;
        if (inBuses === undefined)
            return;
        this.inBuses = inBuses.map(v => {
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
            if (this.inBuses === undefined)
                return data;
            let retBusQuery = [];
            for (let inBus of this.inBuses) {
                let ret = yield this.busQuery(inBus, unit, user, data);
                retBusQuery.push(ret);
            }
            return data + retBusQuery.join('\n\n');
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
                throw 'error on openApiUnitFace';
            }
            let retParam = yield this.runner.call(this.action + '$bus$' + face, [unit, user, data]);
            let retMain = retParam[0][0];
            let params = [];
            if (param !== undefined) {
                let retIndex = 1;
                for (let qp of param) {
                    let { name, type, fields } = qp;
                    let param;
                    if (type === 'array') {
                        param = this.buildTextFromRet(fields, retParam[retIndex++]);
                    }
                    else {
                        param = retMain[name];
                    }
                    params.push(param);
                }
            }
            let ret = yield openApi.busQuery(unit, busOwner, busName, face, params);
            let results = [];
            let { fields, arrs } = returns;
            let text = this.buildTextFromRet(fields, ret[0]);
            results.push(text);
            let len = arrs.length;
            for (let i = 0; i < len; i++) {
                let text = this.buildTextFromRet(arrs[i].fields, ret[i + 1]);
                results.push(text);
            }
            return results.join('\n\n');
        });
    }
    buildTextFromRet(fields, values) {
        let ret = [];
        for (let row of values) {
            let items = [];
            for (let f of fields) {
                items.push(row[f.name]);
            }
            ret.push(items.join('\t'));
        }
        return ret.join('\n');
    }
}
exports.InBusAction = InBusAction;
//# sourceMappingURL=inBusAction.js.map