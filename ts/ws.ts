import {Router, Request, Response, NextFunction} from 'express';
import {Auth, authCheck, AuthUser, debugUnit, debugUser} from './core';


interface UserWss {
    [user:number]: object | object[];
}
interface UnitWss {
    [unit:number]: UserWss;
}
const wss:{[db:string]: UnitWss} = {};
//const userWss:{[user:number]: object | object[]} = {};

export function wsOnConnected(ws, req:Request) {
    authCheck(req, undefined, () => {
        let user:AuthUser = (req as any).user;
        if (user === undefined) {
            user = {
                id: debugUser,
                unit: debugUnit,
                db: req.params.db,
            }
        }
        ws.user = user;
        let {db, unit, id} = user;
        let unitWss = wss[db];
        if (unitWss === undefined) unitWss = wss[db] = {};
        let userWss = unitWss[unit];
        if (userWss === undefined) userWss = unitWss[unit] = {};
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

function wsOnClose(ws, a, b) {
    let user:AuthUser = ws.user;
    if (user === undefined) return;
    let {db, id, unit} = user;
    let unitWss = wss[db];
    if (unitWss === undefined) return;
    let userWss = unitWss[unit]
    if (userWss === undefined) return;
    let wsGroup = userWss[id];
    if (Array.isArray(wsGroup)) {
        let wsArr:any[] = wsGroup;
        switch (wsArr.length) {
            case 0: 
            case 1: delete userWss[id]; break;
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
                if (index >= 0) wsArr.splice(index, 1);
                break;
        }
    }
    else {
        delete userWss[id];
    }
    ws.close();
    console.log('webSocket close id=%s', id);
}

function wsOnMessage(msg:any) {
    console.log(new Date(), " ws receive: ", msg);
}

const wsLogs:string[] = [];
function logws(log:string) {
    wsLogs.push(log);
}
export function wsSendMessage(db:string, unit:number, user:number, msg: any) {
    let unitWss = wss[db];
    if (unitWss === undefined) {
        logws('no ws for db ' + db);
        return;
    }
    let userWss = unitWss[unit];
    if (userWss === undefined) {
        logws('db=' + db + ' no ws for unit ' + unit);
        return;
    }
    let wsGroup = userWss[user];
    if (wsGroup === undefined) {
        logws('db=' + db + ', unit=' + unit + ', no ws for user ' + user);
        return;
    }
    let json = JSON.stringify(msg);
    if (Array.isArray(wsGroup))
        for (let ws of wsGroup) {
            logws('db=' + db + ', unit=' + unit + ', user=' + user + ', json=' + json);
            (ws as any).send(json);
        }
    else {
        logws('db=' + db + ', unit=' + unit + ', user=' + user + ', json=' + json);
        (wsGroup as any).send(json);
    }
}

export const getWsLogs: Router = Router();
getWsLogs.get('/ws', async (req:Request, res:Response) => {
    res.send('<html><body>');
    res.send(wsLogs.join('<br/>'));
    res.send('</body></html>');
    res.end();
});
