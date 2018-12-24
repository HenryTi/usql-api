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
const express_1 = require("express");
const runner_1 = require("../db/runner");
exports.router = express_1.Router();
;
const apiErrors = {
    databaseNotExists: -1,
};
function checkRunner(db, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let runner = yield runner_1.getRunner(db);
        if (runner !== undefined)
            return runner;
        res.json({
            error: {
                no: apiErrors.databaseNotExists,
                message: 'Database ' + db + ' 不存在'
            }
        });
    });
}
exports.checkRunner = checkRunner;
function unknownEntity(res, name) {
    res.json({ error: 'unknown entity: ' + name });
}
exports.unknownEntity = unknownEntity;
function validEntity(res, schema, type) {
    if (schema.type === type)
        return true;
    if (type === 'schema')
        return true;
    res.json({ error: schema.name + ' is not ' + type });
    return false;
}
exports.validEntity = validEntity;
function validTuidArr(res, schema, arrName) {
    let { name, type, arrs } = schema;
    if (type !== 'tuid') {
        res.json({ error: name + ' is not tuid' });
        return;
    }
    let schemaArr = arrs.find(v => v.name === arrName);
    if (schemaArr !== undefined)
        return schemaArr;
    res.json({ error: 'validTuidArr: ' + name + ' does not have arr ' + arrName + ' arrs:' + arrs.map(v => v.name).join(',') });
    return;
}
exports.validTuidArr = validTuidArr;
function getTuidArr(schema, arrName) {
    let { name, type, arrs } = schema;
    if (type !== 'tuid')
        throw name + ' is not tuid';
    let an = arrName.toLowerCase();
    let schemaArr = arrs.find(v => v.name === an);
    if (schemaArr !== undefined)
        return schemaArr;
    throw 'getTuidArr: ' + name + ' does not have arr ' + arrName + ' arrs:' + arrs.map(v => v.name).join(',');
}
exports.getTuidArr = getTuidArr;
//# sourceMappingURL=router.js.map