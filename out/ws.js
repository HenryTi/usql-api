"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const wss = {};
//const userWss:{[user:number]: object | object[]} = {};
function wsOnConnected(ws, req) {
    core_1.authCheck(req, undefined, () => {
        let user = req.user;
        if (user === undefined) {
            user = {
                id: core_1.debugUser,
                unit: core_1.debugUnit,
                db: req.params.db,
            };
        }
        ws.user = user;
        let { db, unit, id } = user;
        let unitWss = wss[db];
        if (unitWss === undefined)
            unitWss = wss[db] = {};
        let userWss = unitWss[unit];
        if (userWss === undefined)
            userWss = unitWss[unit] = {};
        let wsGroup = userWss[id];
        if (wsGroup === undefined)
            userWss[id] = ws;
        else if (Array.isArray(wsGroup)) {
            wsGroup.push(ws);
        }
        else {
            userWss[id] = [wsGroup, ws];
        }
        console.log('webSocket tv connected id=%s', id);
        ws.db = db;
        ws.on('message', wsOnMessage);
        ws.on('close', (a, b) => wsOnClose(ws, a, b));
    });
}
exports.wsOnConnected = wsOnConnected;
function wsOnClose(ws, a, b) {
    let user = ws.user;
    if (user === undefined)
        return;
    let { db, id, unit } = user;
    let unitWss = wss[db];
    if (unitWss === undefined)
        return;
    let userWss = unitWss[unit];
    if (userWss === undefined)
        return;
    let wsGroup = userWss[id];
    if (Array.isArray(wsGroup)) {
        let wsArr = wsGroup;
        switch (wsArr.length) {
            case 0:
            case 1:
                delete userWss[id];
                break;
            case 2:
                if (ws === wsArr[0]) {
                    userWss[id] = wsArr[1];
                    break;
                }
                if (ws === wsArr[1]) {
                    userWss[id] = wsArr[0];
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
        delete userWss[id];
    }
    ws.close();
    console.log('webSocket close id=%s', id);
}
function wsOnMessage(msg) {
    console.log(new Date(), " ws receive: ", msg);
}
function wsSendMessage(db, unit, user, msg) {
    let unitWss = wss[db];
    if (unitWss === undefined)
        return;
    let userWss = unitWss[unit];
    if (userWss === undefined)
        return;
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