"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyBuilders = void 0;
const builders_1 = require("../builders");
const sqlActDetail_1 = require("./sqlActDetail");
const sqlActIX_1 = require("./sqlActIX");
const sqlActs_1 = require("./sqlActs");
const sqlKeyID_1 = require("./sqlKeyID");
const sqlID_1 = require("./sqlID");
const sqlIDDetail_1 = require("./sqlIDDetail");
const sqlIDNO_1 = require("./sqlIDNO");
const sqlIX_1 = require("./sqlIX");
const sqlIXr_1 = require("./sqlIXr");
const sqlIDLog_1 = require("./sqlIDLog");
const sqlIDTree_1 = require("./sqlIDTree");
const sqlIDxID_1 = require("./sqlIDxID");
const sqlIDinIX_1 = require("./sqlIDinIX");
const sqlKeyIX_1 = require("./sqlKeyIX");
const sqlIDSum_1 = require("./sqlIDSum");
const sqlKeyIXSum_1 = require("./sqlKeyIXSum");
const sqlIXSum_1 = require("./sqlIXSum");
const sqlKeyIDSum_1 = require("./sqlKeyIDSum");
const sqlActIXSort_1 = require("./sqlActIXSort");
const sqlQueryID_1 = require("./sqlQueryID");
const sqlIDTv_1 = require("./sqlIDTv");
class MyBuilders extends builders_1.Builders {
    Acts(param) {
        return new sqlActs_1.SqlActs(this, param);
    }
    ActIX(param) {
        return new sqlActIX_1.SqlActIX(this, param);
    }
    ActIXSort(param) {
        return new sqlActIXSort_1.SqlActIXSort(this, param);
    }
    ActDetail(param) {
        return new sqlActDetail_1.SqlActDetail(this, param);
    }
    QueryID(param) {
        return new sqlQueryID_1.SqlQueryID(this, param);
    }
    IDNO(param) {
        return new sqlIDNO_1.SqlIDNO(this, param);
    }
    IDDetailGet(param) {
        return new sqlIDDetail_1.SqlIDDetail(this, param);
    }
    ID(param) {
        return new sqlID_1.SqlID(this, param);
    }
    IDTv(ids) {
        return new sqlIDTv_1.SqlIDTv(this, ids);
    }
    KeyID(param) {
        return new sqlKeyID_1.SqlKeyID(this, param);
    }
    IX(param) {
        return new sqlIX_1.SqlIX(this, param);
    }
    IXr(param) {
        return new sqlIXr_1.SqlIXr(this, param);
    }
    KeyIX(param) {
        return new sqlKeyIX_1.SqlKeyIX(this, param);
    }
    IDLog(param) {
        return new sqlIDLog_1.SqlIDLog(this, param);
    }
    IDSum(param) {
        return new sqlIDSum_1.SqlIDSum(this, param);
    }
    KeyIDSum(param) {
        return new sqlKeyIDSum_1.SqlKeyIDSum(this, param);
    }
    IXSum(param) {
        return new sqlIXSum_1.SqlIXSum(this, param);
    }
    KeyIXSum(param) {
        return new sqlKeyIXSum_1.SqlKeyIXSum(this, param);
    }
    IDinIX(param) {
        return new sqlIDinIX_1.SqlIDinIX(this, param);
    }
    IDxID(param) {
        return new sqlIDxID_1.SqlIDxID(this, param);
    }
    IDTree(param) {
        return new sqlIDTree_1.SqlIDTree(this, param);
    }
}
exports.MyBuilders = MyBuilders;
//# sourceMappingURL=myBuilders.js.map