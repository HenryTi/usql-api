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
const core_1 = require("../core");
const convert_1 = require("../convert");
function actionProcess(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = yield actionReturns(unit, user, name, db, urlParams, runner, body, schema, run);
        let arr0 = result[0];
        if (arr0 === undefined || arr0.length === 0)
            return;
        return arr0[0];
    });
}
exports.actionProcess = actionProcess;
;
function actionReturns(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let { data } = body;
        if (data !== undefined) {
            console.log('action process data: ', body);
            data = core_1.packParam(schema, data);
        }
        console.log('action process param: ', data);
        let result = yield runner.action(name, unit, user, data);
        return result;
    });
}
exports.actionReturns = actionReturns;
function actionConvert(unit, user, entityName, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = _.clone(body.data);
        let { paramConvert, returns } = schema;
        let actionConvertSchema;
        if (paramConvert !== undefined) {
            let { name, to, type } = paramConvert;
            let v = data[name];
            switch (type) {
                case 'expression':
                    expressionConvert(data, v, to);
                    break;
            }
            actionConvertSchema = runner.getActionConvertSchema(entityName);
            if (actionConvertSchema === undefined) {
                actionConvertSchema = _.cloneDeep(schema);
                let fields = actionConvertSchema.fields;
                let index = fields.findIndex(v => v.name === name);
                if (index >= 0) {
                    fields.splice(index, 1);
                    for (let t of to) {
                        fields.push({ name: t, type: 'text' });
                    }
                }
                runner.setActionConvertSchema(entityName, actionConvertSchema);
            }
        }
        //let param = packParam(actionConvertSchema || schema, data);
        let results = yield actionReturns(unit, user, entityName, db, urlParams, runner, { data }, actionConvertSchema || schema, run);
        if (returns == undefined)
            return;
        let len = returns.length;
        let ret = [];
        for (let i = 0; i < len; i++) {
            let result = results[i];
            let returnSchema = returns[i];
            let { convert } = returnSchema;
            if (convert === 'license') {
                ret.push(convert_1.buildLicense(result));
            }
            else {
                ret.push(result);
            }
        }
        return ret;
    });
}
exports.actionConvert = actionConvert;
;
function expressionConvert(data, exp, to) {
    data[to[0]] = convert_1.buildExpVar(exp);
    data[to[1]] = convert_1.buildExpCalc(exp);
}
//# sourceMappingURL=actionProcess.js.map