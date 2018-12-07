import {Router, Request, Response, NextFunction} from 'express';
import * as jwt from 'jsonwebtoken';
import * as config from 'config';

//export const debugUser = config.get<number>('debugUser');
//export const debugUnit = config.get<number>('debugUnit');
export interface AuthUser {
    db: string,
    //id: number,
    //unit: number,
    roles?: string,
}

export default class Auth {
    private roles: string[];
    private anyRole: boolean;
    private noUser: boolean;
    constructor(roles: string[]) {
        if (roles === undefined) {
            this.noUser = true;
            return;
        }
        if (roles[0] === '*') {
            this.anyRole = true;
            return;
        }
        this.roles = roles;
    }
    hasRole(roles:string): boolean {
        if (this.anyRole === true) return true;
        if (roles === undefined) return false;
        let rs: string[] = roles.split(',');
        for (let r of rs) {
            for (let role of this.roles)
                if (r === role) return true;
        }
        return false;
    }
    check(req:Request, res:Response, next:NextFunction) {
        if (this.noUser === true) {
            if (next !== undefined) next();
            return;
        }
        let token = req.header('Authorization');
        if (token === undefined) {
            token = req.header('sec-websocket-protocol');
        }
        if (token === undefined) {
            let err = 'not authorized request';
            console.log(err);
            if (res !== undefined) res.end(err);
            return;
        }
        let secret = config.get<string>('secret'); // .appSecret;
        //console.log('auth check: secret=%s, token=%s', secret, token);
        jwt.verify(token, secret, 
            (err, decoded:AuthUser) => 
        {
            if (err === null) {
                decoded.db = req.params.db;
                (req as any).user = decoded;
                if (this.hasRole(decoded.roles) === true) {
                    if (next !== undefined) next();
                    return;
                }
            }
            if (res !== undefined) {
                res.status(401);
                res.json(
                    {
                        error: {
                            unauthorized: true,
                            message: 'Unauthorized'
                        }
                    });
                // if (next !== undefined) next();
            }
        });
    }
    middleware() {
        let self = this;
        return function (req:Request, res:Response, next:NextFunction) {
            self.check(req, res, next);
        }
    }
    middlewareDebug() {
        let self = this;
        return function (req:Request, res:Response, next:NextFunction) {
            (req as any).user = {
                db: req.params.db,
                //id: debugUser,
                //unit: debugUnit,
                roles: undefined,
            }
            next();
        }
    }
    middlewareUnitx() {
        let self = this;
        return function (req:Request, res:Response, next:NextFunction) {
            (req as any).user = {
                db: req.params.db,
            }
            next();
        }
    }
    middlewareJoint() {
        let self = this;
        return function (req:Request, res:Response, next:NextFunction) {
            let unit = req.header('unit');
            (req as any).user = {
                db: req.params.db,
                unit: unit
            }
            next();
        }
    }
}

export const authCheck = new Auth(['*']).middleware();
export const authDebug = new Auth(['*']).middlewareDebug();
export const authUnitx = new Auth(['*']).middlewareUnitx();
export const authJoint = new Auth(['*']).middlewareJoint();
