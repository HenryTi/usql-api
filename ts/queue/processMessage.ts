import { Message, SheetMessage, ClientMessage, BusMessage } from "../core/model";
import { processSheetMessage } from "./processSheetMessage";
import { pushToClient } from "./pushToClient";
import { processBusMessage } from "./processBusMessage";

export async function processMessage(msg:Message) {
    switch (msg.type) {
        case 'sheet': await processSheetMessage(msg as SheetMessage); break;
        case 'msg': await pushToClient(msg as ClientMessage); break;
        case 'bus': await processBusMessage(msg as BusMessage); break;
    }
}
