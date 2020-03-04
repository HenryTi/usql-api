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
function buildTagRouter(router, rb) {
    rb.get(router, '/tag/values/:name', (runner, body, urlParams, userToken) => __awaiter(this, void 0, void 0, function* () {
        let { id: userId, unit } = userToken;
        let { name } = urlParams;
        let values = yield runner.tagValues(unit, name);
        return values;
    }));
}
exports.buildTagRouter = buildTagRouter;
//# sourceMappingURL=tag.js.map