import { processSheetMessage } from "./processSheetMessage";
import { pushToClient } from "./pushToClient";
import { processBusMessage } from "./processBusMessage";
import { EntityRunner, Message } from "../../core";

type MessageProcesser = (unitxRunner:EntityRunner, msg: Message) => Promise<void>;

export function messageProcesser(msg:Message):MessageProcesser  {
    switch (msg.type) {
        default: debugger; throw 'unknown message type ' + msg.type;
        case 'sheet': return processSheetMessage;
        case 'msg': return pushToClient;
        case 'bus': return processBusMessage;
    }
}
