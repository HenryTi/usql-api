"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const config = require("config");
const debugUser = config.get('debugUser');
const debugUnit = config.get('debugUnit');
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
                    next();
                    return;
                }
            }
            res.status(401);
            res.json({
                error: {
                    unauthorized: true,
                    message: 'Unauthorized'
                }
            });
            //next();
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
                id: debugUser,
                unit: debugUnit,
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
//# sourceMappingURL=auth.js.map