import { Message, SheetMessage, ClientMessage, BusMessage } from "../core/model";
import { processSheetMessage } from "./processSheetMessage";
import { pushToClient } from "./pushToClient";
import { processBusMessage } from "./processBusMessage";
import { Runner } from "../core";

type MessageProcesser = (unitxRunner:Runner, msg: Message) => Promise<void>;

export function messageProcesser(msg:Message):MessageProcesser  {
    switch (msg.type) {
        default: debugger; throw 'unknown message type ' + msg.type;
        case 'sheet': return processSheetMessage;
        case 'msg': return pushToClient;
        case 'bus': return processBusMessage;
    }
}
