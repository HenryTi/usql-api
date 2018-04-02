"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userWss = {};
function wsOnConnected(ws, req) {
    let user = req.user;
    if (user === undefined) {
        // for debug use
        user = {
            id: -99,
        };
        //return;
    }
    let userId = user.id;
    ws.id = userId;
    let wsGroup = userWss[userId];
    if (wsGroup === undefined)
        userWss[userId] = ws;
    else if (Array.isArray(wsGroup)) {
        wsGroup.push(ws);
    }
    else {
        userWss[userId] = [wsGroup, ws];
    }
    console.log('webSocket tv connected id=%s', userId);
    ws.on('message', wsOnMessage);
    ws.on('close', (a, b) => wsOnClose(ws, a, b));
}
exports.wsOnConnected = wsOnConnected;
function wsOnClose(ws, a, b) {
    let wsId = ws.id;
    let wsGroup = userWss[wsId];
    if (Array.isArray(wsGroup)) {
        let wsArr = wsGroup;
        switch (wsArr.length) {
            case 0:
            case 1:
                delete userWss[wsId];
                break;
            case 2:
                if (ws === wsArr[0]) {
                    userWss[wsId] = wsArr[1];
                    break;
                }
                if (ws === wsArr[1]) {
                    userWss[wsId] = wsArr[0];
                    break;
                }
                break;
            default:
                let index = wsArr.findIndex(v => v === ws);
                if (index >= 0)
                    wsArr.splice(index, 1);
                break;
        }
    }
    else {
        delete userWss[wsId];
    }
    ws.close();
    console.log('webSocket close id=%s', wsId);
}
function wsOnMessage(msg) {
    console.log(new Date(), " ws receive: ", msg);
}
function wsSendMessage(user, msg) {
    let wsGroup = userWss[user];
    if (wsGroup === undefined)
        return;
    let json = JSON.stringify(msg);
    if (Array.isArray(wsGroup))
        for (let ws of wsGroup)
            ws.send(json);
    else
        wsGroup.send(json);
}
exports.wsSendMessage = wsSendMessage;
//# sourceMappingURL=ws.js.map