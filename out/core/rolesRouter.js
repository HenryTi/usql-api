"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("./auth");
var IdParam;
(function (IdParam) {
    IdParam[IdParam["none"] = 1] = "none";
    IdParam[IdParam["user"] = 2] = "user";
    IdParam[IdParam["unit"] = 3] = "unit";
})(IdParam = exports.IdParam || (exports.IdParam = {}));
class SqlCallAction {
    constructor(sqlCall, isGetMethod) {
        this.sqlCall = sqlCall;
        this.isGetMethod = isGetMethod;
    }
    call(req, res) {
        let self = this;
        let func;
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
        func(req, this.sqlCall.proc, (err, rows) => {
            if (err !== null) {
                res.json({ error: err });
                return;
            }
            let ret = [];
            let len = rows.length;
            for (let i = 0; i < len - 1; i++)
                ret.push(rows[i]);
            let called = self.sqlCall.called;
            let resJson;
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
        }, this.sqlCall.params, this.isGetMethod ? req.query : req.body);
    }
    action() {
        let self = this;
        return function (req, res) {
            self.call(req, res);
        };
    }
}
class RolesRouter {
    constructor(actions) {
        this.router = express_1.Router();
        for (let path of Object.keys(actions)) {
            let action = actions[path];
            this.regAction(path, action);
        }
    }
    regAction(path, action) {
        let auth;
        let roles = action.roles;
        if (roles !== undefined) {
            if (Array.isArray(roles))
                auth = new auth_1.default(roles);
            else
                auth = new auth_1.default([roles]);
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
exports.RolesRouter = RolesRouter;
//# sourceMappingURL=rolesRouter.js.map