"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const config = require("config");
exports.debugUser = config.get('debugUser');
exports.debugUnit = config.get('debugUnit');
class Auth {
    constructor(roles) {
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
    hasRole(roles) {
        if (this.anyRole === true)
            return true;
        if (roles === undefined)
            return false;
        let rs = roles.split(',');
        for (let r of rs) {
            for (let role of this.roles)
                if (r === role)
                    return true;
        }
        return false;
    }
    check(req, res, next) {
        if (this.noUser === true) {
            if (next !== undefined)
                next();
            return;
        }
        let token = req.header('Authorization');
        if (token === undefined) {
            token = req.header('sec-websocket-protocol');
        }
        if (token === undefined) {
            let err = 'not authorized request';
            console.log(err);
            if (res !== undefined)
                res.end(err);
            return;
        }
        let secret = config.get('secret'); // .appSecret;
        console.log('auth check: secret=%s, token=%s', secret, token);
        jwt.verify(token, secret, (err, decoded) => {
            console.log('auth check: err=%s', JSON.stringify(err));
            if (err === null) {
                decoded.db = req.params.db;
                req.user = decoded;
                if (this.hasRole(decoded.roles) === true) {
                    if (next !== undefined)
                        next();
                    return;
                }
            }
            if (res !== undefined) {
                res.status(401);
                res.json({
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
        return function (req, res, next) {
            self.check(req, res, next);
        };
    }
    middlewareDebug() {
        let self = this;
        return function (req, res, next) {
            req.user = {
                db: req.params.db,
                id: exports.debugUser,
                unit: exports.debugUnit,
                roles: undefined,
            };
            next();
        };
    }
    middlewareUnitx() {
        let self = this;
        return function (req, res, next) {
            req.user = {
                db: req.params.db,
            };
            next();
        };
    }
}
exports.default = Auth;
exports.authCheck = new Auth(['*']).middleware();
exports.authDebug = new Auth(['*']).middlewareDebug();
exports.authUnitx = new Auth(['*']).middlewareUnitx();
//# sourceMappingURL=auth.js.map