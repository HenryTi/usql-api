"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const core_1 = require("../../core");
const entityProcess_1 = require("../entityProcess");
const action_1 = require("../action");
const packReturn_1 = require("../../core/packReturn");
const node_fetch_1 = require("node-fetch");
const fetch_1 = require("../../core/fetch");
exports.router = express_1.Router();
const actionType = 'action';
function default_1(router) {
    entityProcess_1.entityPost(router, actionType, '/:name', unitxAction);
}
exports.default = default_1;
function unitxAction(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (name) {
            default:
                return yield action_1.processAction(unit, user, name, db, urlParams, runner, body, schema, run);
            case 'saveEntityOpPost':
                return yield saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run);
        }
    });
}
function saveEntityOpPost(unit, user, name, db, urlParams, runner, body, schema, run) {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParam = packReturn_1.unpack(schema, body.data);
        let { usq } = actionParam;
        let urqUrl = yield core_1.centerApi.usqUrl(unit, usq);
        let { url, urlDebug } = urqUrl;
        if (urlDebug !== undefined) {
            // 这个地方会有问题，urlDebug也许指向错误
            try {
                let ret = yield node_fetch_1.default(urlDebug + 'hello');
                if (ret.status !== 200)
                    throw 'not ok';
                let text = yield ret.text();
                url = urlDebug;
            }
            catch (err) {
            }
        }
        let usqApi = new UsqApi(url);
        yield usqApi.setAccess(unit, usq);
        // 设置usq里面entity的access之后，才写unitx中的entity access
        return yield action_1.processAction(unit, user, name, db, urlParams, runner, body, schema, run);
    });
}
class UsqApi extends fetch_1.Fetch {
    setAccess(unit, usq) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = { unit: unit, usq: usq };
            return yield this.post('/access', params);
        });
    }
}
//# sourceMappingURL=router.js.map