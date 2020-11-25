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
exports.getUserX = void 0;
const core_1 = require("../core");
const tool_1 = require("../tool");
const userxCache = new tool_1.Cache(3, 10);
function buildUserX(runner, to, bus, face) {
    return __awaiter(this, void 0, void 0, function* () {
        // runner 可以做本地数据库缓存，不一定每次都到中央服务器获取，减轻中央服务器压力
        let results = yield core_1.centerApi.userxBusFace(to, bus, face);
        return results;
    });
}
function getUserX(runner, to, bus, face) {
    return __awaiter(this, void 0, void 0, function* () {
        // 如果发给指定用户
        // unit为指定service id，并且为负数
        let faceUserX;
        let userXArr;
        let busUserX = userxCache.get(to);
        if (busUserX === undefined) {
            busUserX = {};
            userxCache.set(to, busUserX);
        }
        faceUserX = busUserX[bus];
        if (faceUserX === undefined) {
            faceUserX = busUserX[bus] = {};
        }
        userXArr = faceUserX[face];
        if (userXArr === undefined) {
            userXArr = yield buildUserX(runner, to, bus, face);
            faceUserX[face] = userXArr;
        }
        return userXArr.map(v => -v.service);
    });
}
exports.getUserX = getUserX;
//# sourceMappingURL=getUserX.js.map