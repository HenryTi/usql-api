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
const processSheetMessage_1 = require("./processSheetMessage");
const pushToClient_1 = require("./pushToClient");
const processBusMessage_1 = require("./processBusMessage");
function processMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (msg.type) {
            case 'sheet':
                yield processSheetMessage_1.processSheetMessage(msg);
                break;
            case 'msg':
                yield pushToClient_1.pushToClient(msg);
                break;
            case 'bus':
                yield processBusMessage_1.processBusMessage(msg);
                break;
        }
    });
}
exports.processMessage = processMessage;
//# sourceMappingURL=processMessage.js.map