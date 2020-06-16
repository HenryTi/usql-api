"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageProcesser = void 0;
const processSheetMessage_1 = require("./processSheetMessage");
const pushToClient_1 = require("./pushToClient");
const processBusMessage_1 = require("./processBusMessage");
function messageProcesser(msg) {
    switch (msg.type) {
        default:
            debugger;
            throw 'unknown message type ' + msg.type;
        case 'sheet': return processSheetMessage_1.processSheetMessage;
        case 'msg': return pushToClient_1.pushToClient;
        case 'bus': return processBusMessage_1.processBusMessage;
    }
}
exports.messageProcesser = messageProcesser;
//# sourceMappingURL=messageProcesser.js.map