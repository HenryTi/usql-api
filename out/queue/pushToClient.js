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
const core_1 = require("../core");
// 现在简单的把client message推送给center，由center来分发给client
// 以后需要做client消息分发服务器
function pushToClient(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield core_1.centerApi.pushTo(msg);
        }
        catch (err) {
            console.error(err);
        }
    });
}
exports.pushToClient = pushToClient;
//# sourceMappingURL=pushToClient.js.map