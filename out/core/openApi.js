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
//import fetch from "node-fetch";
const _1 = require(".");
class OpenApi extends _1.Fetch {
    fromEntity(unit, entity, key) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/from-entity', {
                unit: unit,
                entity: entity,
                key: key,
            });
            return ret;
        });
    }
    queueModify(unit, start, page, entities) {
        return __awaiter(this, void 0, void 0, function* () {
            if (start === undefined || start === null)
                start = 0;
            let ret = yield this.post('open/queue-modify', {
                unit: unit,
                start: start,
                page: page,
                entities: entities,
            });
            return ret;
        });
    }
    busQuery(unit, busOwner, busName, face, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.post('open/bus-query', {
                unit: unit,
                busOwner: busOwner,
                busName: busName,
                face: face,
                params: params
            });
            return ret;
        });
    }
}
exports.OpenApi = OpenApi;
//# sourceMappingURL=openApi.js.map