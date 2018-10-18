import { ClientMessage } from "./model";
import { centerApi } from "../core";

// 现在简单的把client message推送给center，由center来分发给client
// 以后需要做client消息分发服务器
export async function pushToClient(msg: ClientMessage):Promise<void> {
    await centerApi.pushTo(msg);
}
