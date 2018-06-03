import {Router, Request, Response, NextFunction} from 'express';
import {QueryError, RowDataPacket, FieldPacket} from 'mysql';
import Auth from './auth';

export enum IdParam {
    none=1, user=2, unit=3
}

interface SqlCall {
    proc: string;
    idParam?: IdParam; // default: DefParam.user
    params?: string[];
    called?: (rows: any[][]) => any;
}

export interface Action {
    method: string;
    roles?: string|string[];
    act?: ((req:Request, res:Response) => void) | SqlCall;
    // sqlCall?: SqlCall;
}

class SqlCallAction {
    private sqlCall: SqlCall
    private isGetMethod: boolean;
    constructor(sqlCall: SqlCall, isGetMethod: boolean) {
        this.sqlCall = sqlCall;
        this.isGetMethod = isGetMethod;
    }
    private call(req:Request, res:Response) {
        let self = this;
        let func:(req:Request, procName:string, 
            callback:(err: QueryError, rows: RowDataPacket[])=>void,
            paramKeys:string[], paramValues:any)=>void;
        if (this.sqlCall === undefined) {
            res.json({
                ok: true,
            });
            return;
        }
        switch (this.sqlCall.idParam) {
            default:
            //case IdParam.none: func = noIdCall; break;
            //case IdParam.user: func = userCall; break;
            //case IdParam.unit: func = unitCall; break;
        }
        func(req, this.sqlCall.proc, (err: QueryError, rows: RowDataPacket[]) => {
            if (err !== null) {
                res.json({error: err});
                return;
            }
            let ret:any[][] = [];
            let len = rows.length;
            for (let i=0;i<len-1;i++) ret.push((rows as any)[i]);
            let called = self.sqlCall.called;
            let resJson: any;
            if (called !== undefined)
                resJson = called(ret);
            else if (ret.length === 1)
                resJson = ret[0];
            else
                resJson = ret;
            res.json({
                ok: true,
                res: resJson
            });
        }, 
        this.sqlCall.params, 
        this.isGetMethod? req.query : (req as any).body);
    }
    action() {
        let self = this;
        return function(req:Request, res:Response):void {
            self.call(req, res);
        }
    }
}

export class RolesRouter {
    router: Router;
    constructor(actions: {[path:string]: Action}) {
        this.router = Router();
        for(let path of Object.keys(actions)) {
            let action = actions[path];
            this.regAction(path, action);
        }
    }
    private regAction(path: string, action: Action) {
        let auth: Auth;
        let roles = action.roles;
        if (roles !== undefined) {
            if (Array.isArray(roles))
                auth = new Auth(roles);
            else
                auth = new Auth([roles]);
        }

        let act = action.act, method = action.method.toLowerCase();
        if (typeof act !== "function") {
            act = new SqlCallAction(act, method === 'get').action();
        }
        if (auth === undefined) {
            switch (method) {
                default: break;
                case 'get':
                    this.router.get(path, act);
                    break;
                case 'post':
                    this.router.post(path, act);
                    break;
                case 'put':
                    this.router.put(path, act);
                    break;
                case 'delete':
                    this.router.delete(path, act);
                    break;
                case 'patch':
                    this.router.patch(path, act);
                    break;
            }
        }
        else {
            let authCheck = auth.middleware();
            switch (method) {
                default: break;
                case 'get':
                    this.router.get(path, authCheck, act);
                    break;
                case 'post':
                    this.router.post(path, authCheck, act);
                    break;
                case 'put':
                    this.router.put(path, authCheck, act);
                    break;
                case 'delete':
                    this.router.delete(path, authCheck, act);
                    break;
                case 'patch':
                    this.router.patch(path, authCheck, act);
                    break;
            }
        }
    }
}
